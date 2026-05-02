import { Module } from '~/extensions/module';
import bus, { PlayEvent } from '~/extensions/event';
import { Speaker, Waveform } from '~/extensions/speaker';
import {
    canUseNativePlayback,
    startNativePlayback,
    stopNativePlayback,
    updateNativePlayback,
} from '~/platform/native';

const TICK_FREQ = 1600;
const TOK_FREQ = 800;
const TAK_FREQ = 600;

/**
 * {
 *   "bpm": 120,
 *   "beats": 4,
 *   "stressFirst": true,
 *   "subdivision": [1, 0, 1, 1]
 *   "waveform": "sine"
 * }
 */
class Player extends Module {
    private speaker: Speaker;

    private bpm: number = 60;
    private beats: number = 4;
    private stressFirst: boolean = true;
    private subdivision: number[] = [1];
    private currentWaveform: Waveform = 'square';

    private playbackBackend: 'web' | 'native' = 'web';

    private intervalHandle: number = -1;
    private currentBeat: number = 0;
    private currentNote: number = 0;

    private playButton: HTMLButtonElement = undefined!;
    private playText: HTMLSpanElement = undefined!;
    private stopText: HTMLSpanElement = undefined!;

    constructor(speaker: Speaker) {
        super();
        this.speaker = speaker;
    }

    mount(): void {
        this.playButton = document.getElementById('play') as HTMLButtonElement;
        this.playText = document.getElementById('play-play') as HTMLSpanElement;
        this.stopText = document.getElementById('play-stop') as HTMLSpanElement;

        bus.on('bpm-changed', this.onBpmChanged.bind(this));
        bus.on('beats-changed', this.onBeatsChanged.bind(this));
        bus.on('stress-changed', this.onStressChanged.bind(this));
        bus.on('subdivision-changed', this.onSubdivisionChanged.bind(this));
        bus.on('waveform-changed', this.onWaveformChanged.bind(this));

        bus.on('toggle-play', this.onTogglePlay.bind(this));
        bus.on('switch', this.onSwitch.bind(this));

        this.updateDisplay();
    }

    private onBpmChanged(bpm: number): void {
        this.bpm = bpm;
        if (!this.isPlaying()) {
            return;
        }
        if (this.playbackBackend === 'native') {
            void this.updateNativePlayback();
            this.restartTickerOnly();
        } else {
            bus.emit('toggle-play', { replay: true });
        }
    }

    private onBeatsChanged(beats: number): void {
        this.beats = beats;
        if (!this.isPlaying()) {
            return;
        }
        if (this.playbackBackend === 'native') {
            void this.updateNativePlayback();
            this.resyncNativeFromBeatZero();
        } else {
            bus.emit('toggle-play', { replay: true });
        }
    }

    private onStressChanged(stress: boolean): void {
        this.stressFirst = stress;

        if (this.isPlaying() && this.playbackBackend === 'native') {
            void this.updateNativePlayback();
        }
    }

    private onSubdivisionChanged(subdivision: number[]): void {
        const lengthChanged = subdivision.length !== this.subdivision.length;
        this.subdivision = subdivision;
        if (!this.isPlaying()) {
            return;
        }
        if (this.playbackBackend === 'native') {
            void this.updateNativePlayback();
            if (lengthChanged) {
                this.resyncNativeFromBeatZero();
            } else {
                this.restartTickerOnly();
            }
        } else {
            bus.emit('toggle-play', { replay: true });
        }
    }

    private onWaveformChanged(waveform: Waveform): void {
        this.currentWaveform = waveform;
        this.speaker.setWaveform(waveform);

        if (this.isPlaying() && this.playbackBackend === 'native') {
            void this.updateNativePlayback();
        }
    }

    private onTogglePlay(event: PlayEvent): void {
        if (event.replay) {
            if (this.isPlaying()) {
                this.stop();
                this.play();
                this.updateDisplay();
            }
        } else {
            if (this.isPlaying()) {
                this.stop();
            } else {
                this.play();
            }
            this.updateDisplay();
        }
    }

    private onSwitch(): void {
        if (this.isPlaying()) {
            this.stop();
            this.updateDisplay();
        }
    }

    private play(): void {
        // play event should be emitted before beat event
        bus.emit('play');

        const delay = 60000.0 / (this.bpm * this.subdivision.length);
        this.currentBeat = 0;
        this.currentNote = 0;

        this.selectPlaybackBackend();
        if (this.playbackBackend === 'native') {
            void this.startNativePlayback();
        }

        this.step();
        this.intervalHandle = setInterval(() => this.step(), delay);
    }

    private isPlaying(): boolean {
        return this.intervalHandle !== -1;
    }

    private step(): void {
        if (this.subdivision[this.currentNote] === 1) {
            if (this.playbackBackend === 'web') {
                if (this.isFirstBeat()) {
                    this.speaker.play(this.stressFirst ? TICK_FREQ : TOK_FREQ);
                } else {
                    this.speaker.play(this.isFirstNote() ? TOK_FREQ : TAK_FREQ);
                }
            }
        }

        if (this.isFirstNote()) {
            bus.emit('beat');
        }

        if (++this.currentNote >= this.subdivision.length) {
            this.currentNote = 0;
            if (++this.currentBeat >= this.beats) {
                this.currentBeat = 0;
            }
        }
    }

    private isFirstBeat(): boolean {
        return this.currentBeat === 0 && this.currentNote === 0;
    }

    private isFirstNote(): boolean {
        return this.currentNote === 0;
    }

    private stop(): void {
        if (this.playbackBackend === 'native') {
            void stopNativePlayback();
        }

        if (this.intervalHandle !== -1) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = -1;
            bus.emit('stop');
        }

        this.playbackBackend = 'web';
    }

    private selectPlaybackBackend(): void {
        this.playbackBackend = canUseNativePlayback() ? 'native' : 'web';
    }

    private buildNativePlaybackOptions() {
        return {
            bpm: this.bpm,
            beats: this.beats,
            stressFirst: this.stressFirst,
            subdivision: this.subdivision,
            waveform: this.currentWaveform,
        };
    }

    private async startNativePlayback(): Promise<void> {
        const started = await startNativePlayback(this.buildNativePlaybackOptions());
        if (!started) {
            this.playbackBackend = 'web';
        }
    }

    private async updateNativePlayback(): Promise<void> {
        const updated = await updateNativePlayback(this.buildNativePlaybackOptions());
        if (!updated) {
            this.playbackBackend = 'web';
        }
    }

    private restartTickerOnly(): void {
        if (this.intervalHandle !== -1) {
            clearInterval(this.intervalHandle);
        }
        const delay = 60000.0 / (this.bpm * this.subdivision.length);
        this.intervalHandle = setInterval(() => this.step(), delay);
    }

    private resyncNativeFromBeatZero(): void {
        // Native side resets to beat 0; reset JS visual state and fire the
        // first step immediately so the dot highlights in sync with the
        // upcoming native click instead of waiting a full beat period.
        this.currentBeat = 0;
        this.currentNote = 0;
        bus.emit('play');
        this.step();
        this.restartTickerOnly();
    }

    private updateDisplay(): void {
        if (this.isPlaying()) {
            this.playButton.classList.remove('stopped');
            this.playButton.classList.add('playing');
            this.playText.style.display = 'none';
            this.stopText.style.display = 'block';
        } else {
            this.playButton.classList.remove('playing');
            this.playButton.classList.add('stopped');
            this.playText.style.display = 'block';
            this.stopText.style.display = 'none';
        }
    }
}

export default Player;
