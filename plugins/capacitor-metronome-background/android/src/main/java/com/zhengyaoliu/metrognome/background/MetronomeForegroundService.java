package com.zhengyaoliu.metrognome.background;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.ArrayDeque;
import java.util.Iterator;
import java.util.concurrent.atomic.AtomicReference;

public class MetronomeForegroundService extends Service {
    // --- Beat listener bridge -----------------------------------------------
    // The plugin owns the listener instance (set in load(), cleared in
    // handleOnDestroy()), so a strong static reference is correct here -
    // the plugin's lifecycle keeps it alive, and clearBeatListener() drops
    // it when the activity tears down.

    public interface BeatListener {
        void onBeat(int beatIndex);
    }

    private static volatile BeatListener beatListener;

    public static void setBeatListener(BeatListener listener) {
        beatListener = listener;
    }

    public static void clearBeatListener() {
        beatListener = null;
    }

    private static void notifyBeat(int beatIndex) {
        BeatListener listener = beatListener;
        if (listener != null) {
            listener.onBeat(beatIndex);
        }
    }

    // --- Service intent contract -------------------------------------------

    public static final String ACTION_START = "com.zhengyaoliu.metrognome.background.action.START";
    public static final String ACTION_UPDATE = "com.zhengyaoliu.metrognome.background.action.UPDATE";
    public static final String ACTION_STOP = "com.zhengyaoliu.metrognome.background.action.STOP";

    public static final String EXTRA_BPM = "bpm";
    public static final String EXTRA_BEATS = "beats";
    public static final String EXTRA_STRESS_FIRST = "stressFirst";
    public static final String EXTRA_SUBDIVISION = "subdivision";
    public static final String EXTRA_WAVEFORM = "waveform";

    private static final String LOG_TAG = "MetrognomeService";
    private static final String CHANNEL_ID = "metrognome_playback";
    private static final int NOTIFICATION_ID = 1024;

    private static final int SAMPLE_RATE = 48000;
    private static final int BLOCK_FRAMES = 240; // 5 ms at 48 kHz

    // Match the Web Speaker exactly: same frequencies and same 40 ms duration.
    private static final double TICK_HZ = 1600.0;
    private static final double TOK_HZ = 800.0;
    private static final double TAK_HZ = 600.0;
    private static final double CLICK_DURATION_MS = 40.0;

    private static final String WAVEFORM_SINE = "sine";
    private static final String WAVEFORM_SQUARE = "square";
    private static final String WAVEFORM_SAWTOOTH = "sawtooth";
    private static final String WAVEFORM_TRIANGLE = "triangle";
    private static final String DEFAULT_WAVEFORM = WAVEFORM_SQUARE;

    private final AtomicReference<PlaybackConfig> pendingConfig = new AtomicReference<>(null);
    private volatile boolean running = false;

    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private Thread audioThread;

    // Cached click buffers for the currently active waveform. Regenerated
    // whenever the waveform changes so the runtime cost stays in startup,
    // not in the audio loop.
    private String cachedWaveform = "";
    private short[] tickClick;
    private short[] tokClick;
    private short[] takClick;

    @Override
    public void onCreate() {
        super.onCreate();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        ensureClickCache(DEFAULT_WAVEFORM);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(@Nullable Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) {
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        PlaybackConfig config = PlaybackConfig.fromIntent(intent);

        if (ACTION_START.equals(action)) {
            startPlayback(config);
            return START_STICKY;
        }

        if (ACTION_UPDATE.equals(action)) {
            pendingConfig.set(config);
            return START_STICKY;
        }

        if (ACTION_STOP.equals(action)) {
            stopPlayback();
            return START_NOT_STICKY;
        }

        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void startPlayback(PlaybackConfig config) {
        Notification notification = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        requestAudioFocus();

        pendingConfig.set(config);
        if (audioThread != null && audioThread.isAlive()) {
            return;
        }
        running = true;
        audioThread = new Thread(this::audioLoop, "MetrognomeAudio");
        audioThread.setPriority(Thread.MAX_PRIORITY);
        audioThread.start();
    }

    private void stopPlayback() {
        running = false;
        if (audioThread != null) {
            try {
                audioThread.join(500L);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            audioThread = null;
        }
        abandonAudioFocus();
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private void requestAudioFocus() {
        if (audioManager == null) {
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attributes)
                .setWillPauseWhenDucked(false)
                .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) {
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
                audioFocusRequest = null;
            }
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }

    private void audioLoop() {
        AudioTrack track = null;
        try {
            track = createAudioTrack();
            track.play();

            PlaybackConfig cfg = pendingConfig.getAndSet(null);
            if (cfg == null) {
                cfg = PlaybackConfig.defaults();
            }
            ensureClickCache(cfg.waveform);
            double samplesPerNote = computeSamplesPerNote(cfg);

            long framesWritten = 0L;
            double nextClickFrame = SAMPLE_RATE * 0.005; // 5ms warm-up
            int beatIdx = 0;
            int noteIdx = 0;

            ArrayDeque<Voice> voices = new ArrayDeque<>();
            short[] buffer = new short[BLOCK_FRAMES];

            while (running) {
                PlaybackConfig pending = pendingConfig.getAndSet(null);
                if (pending != null) {
                    boolean structureChanged = cfg == null
                        || pending.beats != cfg.beats
                        || pending.subdivision.length != cfg.subdivision.length;
                    cfg = pending;
                    ensureClickCache(cfg.waveform);
                    samplesPerNote = computeSamplesPerNote(cfg);
                    if (structureChanged) {
                        beatIdx = 0;
                        noteIdx = 0;
                        nextClickFrame = framesWritten + SAMPLE_RATE * 0.005;
                        voices.clear();
                    } else {
                        // keep playback position so visuals stay synced; clamp indices
                        if (beatIdx >= cfg.beats) {
                            beatIdx = 0;
                        }
                        if (noteIdx >= cfg.subdivision.length) {
                            noteIdx = 0;
                        }
                    }
                }

                java.util.Arrays.fill(buffer, (short) 0);

                long blockStart = framesWritten;
                long blockEnd = framesWritten + BLOCK_FRAMES;

                // schedule new clicks falling in this block
                while (nextClickFrame < blockEnd) {
                    long startFrame = Math.max(blockStart, (long) nextClickFrame);
                    int offset = (int) (startFrame - blockStart);
                    if (cfg.subdivision[noteIdx] == 1) {
                        voices.add(new Voice(pickClick(cfg, beatIdx, noteIdx), offset));
                    }
                    // Beat boundary: fire on the first sub-note of each beat,
                    // unconditional (matches web Player.step which emits beat
                    // regardless of subdivision[0] being muted).
                    if (noteIdx == 0) {
                        notifyBeat(beatIdx);
                    }
                    noteIdx++;
                    if (noteIdx >= cfg.subdivision.length) {
                        noteIdx = 0;
                        beatIdx++;
                        if (beatIdx >= cfg.beats) {
                            beatIdx = 0;
                        }
                    }
                    nextClickFrame += samplesPerNote;
                }

                // mix all active voices into buffer
                Iterator<Voice> it = voices.iterator();
                while (it.hasNext()) {
                    Voice voice = it.next();
                    int srcRemaining = voice.data.length - voice.pos;
                    int dstRoom = BLOCK_FRAMES - voice.offset;
                    int n = Math.min(srcRemaining, dstRoom);
                    for (int i = 0; i < n; i++) {
                        int mixed = buffer[voice.offset + i] + voice.data[voice.pos + i];
                        if (mixed > Short.MAX_VALUE) mixed = Short.MAX_VALUE;
                        else if (mixed < Short.MIN_VALUE) mixed = Short.MIN_VALUE;
                        buffer[voice.offset + i] = (short) mixed;
                    }
                    voice.pos += n;
                    voice.offset = 0;
                    if (voice.pos >= voice.data.length) {
                        it.remove();
                    }
                }

                // blocking write paces the loop to the audio clock
                int written = track.write(buffer, 0, BLOCK_FRAMES);
                if (written <= 0) {
                    if (written == AudioTrack.ERROR_INVALID_OPERATION
                        || written == AudioTrack.ERROR_BAD_VALUE
                        || written == AudioTrack.ERROR_DEAD_OBJECT) {
                        Log.w(LOG_TAG, "AudioTrack write failed: " + written);
                        break;
                    }
                }
                framesWritten += BLOCK_FRAMES;
            }
        } catch (Exception error) {
            Log.e(LOG_TAG, "Audio thread crashed", error);
        } finally {
            if (track != null) {
                try {
                    track.stop();
                } catch (IllegalStateException ignored) {
                }
                track.release();
            }
        }
    }

    private AudioTrack createAudioTrack() {
        int minBufBytes = AudioTrack.getMinBufferSize(SAMPLE_RATE,
            AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT);
        // Aim for roughly 2 blocks of buffer to keep latency tight while avoiding underruns
        int desiredBytes = BLOCK_FRAMES * 2 /* bytes per frame */ * 4;
        int bufBytes = Math.max(minBufBytes, desiredBytes);

        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        AudioFormat format = new AudioFormat.Builder()
            .setSampleRate(SAMPLE_RATE)
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .build();

        AudioTrack.Builder builder = new AudioTrack.Builder()
            .setAudioAttributes(attributes)
            .setAudioFormat(format)
            .setBufferSizeInBytes(bufBytes)
            .setTransferMode(AudioTrack.MODE_STREAM);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder.setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY);
        }
        return builder.build();
    }

    private static double computeSamplesPerNote(PlaybackConfig cfg) {
        int subdivisionLength = cfg.subdivision != null && cfg.subdivision.length > 0
            ? cfg.subdivision.length
            : 1;
        return (60.0 * SAMPLE_RATE) / Math.max(1, cfg.bpm * subdivisionLength);
    }

    private short[] pickClick(PlaybackConfig cfg, int beatIdx, int noteIdx) {
        if (beatIdx == 0 && noteIdx == 0) {
            return cfg.stressFirst ? tickClick : tokClick;
        }
        return noteIdx == 0 ? tokClick : takClick;
    }

    private void ensureClickCache(String waveform) {
        String normalized = normalizeWaveform(waveform);
        if (normalized.equals(cachedWaveform) && tickClick != null) {
            return;
        }
        tickClick = generateClick(normalized, TICK_HZ, CLICK_DURATION_MS, 0.95);
        tokClick = generateClick(normalized, TOK_HZ, CLICK_DURATION_MS, 0.85);
        takClick = generateClick(normalized, TAK_HZ, CLICK_DURATION_MS, 0.70);
        cachedWaveform = normalized;
    }

    private static String normalizeWaveform(String waveform) {
        if (waveform == null) {
            return DEFAULT_WAVEFORM;
        }
        switch (waveform) {
            case WAVEFORM_SINE:
            case WAVEFORM_SQUARE:
            case WAVEFORM_SAWTOOTH:
            case WAVEFORM_TRIANGLE:
                return waveform;
            default:
                return DEFAULT_WAVEFORM;
        }
    }

    private static short[] generateClick(String waveform, double freqHz, double durationMs, double amplitude) {
        int frames = (int) Math.round(SAMPLE_RATE * durationMs / 1000.0);
        short[] buf = new short[frames];
        double phaseStep = freqHz / SAMPLE_RATE;
        // Short attack/release ramps (~1 ms) prevent the digital pop that
        // Web's AudioContext smooths over implicitly. We do not apply an
        // exponential decay so the timbre matches the Web oscillator.
        int ramp = Math.max(1, SAMPLE_RATE / 1000);
        for (int i = 0; i < frames; i++) {
            double phase = (phaseStep * i) % 1.0;
            double sample = waveformSample(waveform, phase);
            double envelope = 1.0;
            if (i < ramp) {
                envelope = (double) i / ramp;
            } else if (i > frames - ramp) {
                envelope = (double) (frames - i) / ramp;
            }
            int s = (int) Math.round(sample * envelope * amplitude * 32767.0);
            if (s > Short.MAX_VALUE) s = Short.MAX_VALUE;
            else if (s < Short.MIN_VALUE) s = Short.MIN_VALUE;
            buf[i] = (short) s;
        }
        return buf;
    }

    private static double waveformSample(String waveform, double phase) {
        switch (waveform) {
            case WAVEFORM_SQUARE:
                return phase < 0.5 ? 1.0 : -1.0;
            case WAVEFORM_SAWTOOTH:
                return 2.0 * phase - 1.0;
            case WAVEFORM_TRIANGLE:
                return phase < 0.5
                    ? 4.0 * phase - 1.0
                    : 3.0 - 4.0 * phase;
            case WAVEFORM_SINE:
            default:
                return Math.sin(2.0 * Math.PI * phase);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) {
            return;
        }

        NotificationChannel channel = manager.getNotificationChannel(CHANNEL_ID);
        if (channel != null) {
            return;
        }

        channel = new NotificationChannel(
            CHANNEL_ID,
            "Metrognome Playback",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Background metronome playback");
        manager.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentIntent = null;

        if (launchIntent != null) {
            contentIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Metrognome")
            .setContentText("Metronome playback running")
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        if (contentIntent != null) {
            builder.setContentIntent(contentIntent);
        }

        return builder.build();
    }

    private static final class Voice {
        final short[] data;
        int pos;
        int offset;

        Voice(short[] data, int offset) {
            this.data = data;
            this.pos = 0;
            this.offset = offset;
        }
    }

    private static final class PlaybackConfig {
        final int bpm;
        final int beats;
        final boolean stressFirst;
        final int[] subdivision;
        final String waveform;

        PlaybackConfig(int bpm, int beats, boolean stressFirst, int[] subdivision, String waveform) {
            this.bpm = bpm;
            this.beats = beats;
            this.stressFirst = stressFirst;
            this.subdivision = subdivision;
            this.waveform = waveform;
        }

        static PlaybackConfig defaults() {
            return new PlaybackConfig(60, 4, true, new int[] { 1 }, DEFAULT_WAVEFORM);
        }

        static PlaybackConfig fromIntent(Intent intent) {
            int bpm = clamp(intent.getIntExtra(EXTRA_BPM, 60), 1, 400);
            int beats = clamp(intent.getIntExtra(EXTRA_BEATS, 4), 1, 32);
            boolean stressFirst = intent.getBooleanExtra(EXTRA_STRESS_FIRST, true);
            int[] raw = intent.getIntArrayExtra(EXTRA_SUBDIVISION);
            int[] subdivision;
            if (raw != null && raw.length > 0) {
                subdivision = new int[raw.length];
                for (int i = 0; i < raw.length; i++) {
                    subdivision[i] = raw[i] == 0 ? 0 : 1;
                }
            } else {
                subdivision = new int[] { 1 };
            }
            String waveform = normalizeWaveform(intent.getStringExtra(EXTRA_WAVEFORM));
            return new PlaybackConfig(bpm, beats, stressFirst, subdivision, waveform);
        }

        private static int clamp(int value, int min, int max) {
            return Math.max(min, Math.min(max, value));
        }
    }
}
