package com.zhengyaoliu.metrognome.background;

import android.content.Context;
import android.content.Intent;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MetronomeBackground", events = { "beat" })
public class MetronomeBackgroundPlugin extends Plugin {

    @Override
    public void load() {
        super.load();
        MetronomeForegroundService.setBeatListener(beatIndex -> {
            JSObject payload = new JSObject();
            payload.put("beatIndex", beatIndex);
            notifyListeners("beat", payload);
        });
    }

    @Override
    protected void handleOnDestroy() {
        MetronomeForegroundService.clearBeatListener();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        call.resolve(result);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        call.resolve(result);
    }

    @PluginMethod
    public void startPlayback(PluginCall call) {
        try {
            Context context = getContext().getApplicationContext();
            Intent intent = buildServiceIntent(context, MetronomeForegroundService.ACTION_START, call);
            ContextCompat.startForegroundService(context, intent);
            call.resolve();
        } catch (IllegalArgumentException error) {
            call.reject(error.getMessage());
        } catch (Exception error) {
            call.reject("Failed to start native metronome playback", error);
        }
    }

    @PluginMethod
    public void updatePlayback(PluginCall call) {
        try {
            Context context = getContext().getApplicationContext();
            Intent intent = buildServiceIntent(context, MetronomeForegroundService.ACTION_UPDATE, call);
            context.startService(intent);
            call.resolve();
        } catch (IllegalArgumentException error) {
            call.reject(error.getMessage());
        } catch (Exception error) {
            call.reject("Failed to update native metronome playback", error);
        }
    }

    @PluginMethod
    public void stopPlayback(PluginCall call) {
        try {
            Context context = getContext().getApplicationContext();
            Intent intent = new Intent(context, MetronomeForegroundService.class);
            intent.setAction(MetronomeForegroundService.ACTION_STOP);
            context.startService(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject("Failed to stop native metronome playback", error);
        }
    }

    private Intent buildServiceIntent(Context context, String action, PluginCall call) {
        int bpm = call.getInt("bpm", 60);
        int beats = call.getInt("beats", 4);
        boolean stressFirst = call.getBoolean("stressFirst", true);
        String waveform = call.getString("waveform", "square");
        int[] subdivision = parseSubdivision(call.getArray("subdivision"));

        if (bpm < 1 || bpm > 400) {
            throw new IllegalArgumentException("bpm must be within 1..400");
        }
        if (beats < 1 || beats > 32) {
            throw new IllegalArgumentException("beats must be within 1..32");
        }

        Intent intent = new Intent(context, MetronomeForegroundService.class);
        intent.setAction(action);
        intent.putExtra(MetronomeForegroundService.EXTRA_BPM, bpm);
        intent.putExtra(MetronomeForegroundService.EXTRA_BEATS, beats);
        intent.putExtra(MetronomeForegroundService.EXTRA_STRESS_FIRST, stressFirst);
        intent.putExtra(MetronomeForegroundService.EXTRA_SUBDIVISION, subdivision);
        intent.putExtra(MetronomeForegroundService.EXTRA_WAVEFORM, waveform);
        return intent;
    }

    private int[] parseSubdivision(JSArray array) {
        if (array == null || array.length() == 0) {
            return new int[] { 1 };
        }

        int[] parsed = new int[array.length()];
        for (int index = 0; index < array.length(); index++) {
            int note = array.optInt(index, 1);
            parsed[index] = note == 0 ? 0 : 1;
        }
        return parsed;
    }
}
