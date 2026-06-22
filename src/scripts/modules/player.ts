import type { PluginListenerHandle } from '@capacitor/core';

import { Module } from '~/extensions/module';
import bus, { PlayEvent } from '~/extensions/event';
import { Waveform } from '~/extensions/speaker';
import { PlaybackEngine, PlaybackOptions, selectPlaybackEngine } from '~/platform/native';

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
    private bpm: number = 60;
    private beats: number = 4;
    private stressFirst: boolean = true;
    private subdivision: number[] = [1];
    private currentWaveform: Waveform = 'square';

    private playing: boolean = false;
    private engine: PlaybackEngine | null = null;
    private beatHandle: PluginListenerHandle | null = null;

    private playButton: HTMLButtonElement = undefined!;
    private playText: HTMLSpanElement = undefined!;
    private stopText: HTMLSpanElement = undefined!;

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
        bus.on('toggle-mode', this.onToggleMode.bind(this));

        this.updateDisplay();
    }

    private onBpmChanged(bpm: number): void {
        this.bpm = bpm;
        this.pushUpdate();
    }

    private onBeatsChanged(beats: number): void {
        this.beats = beats;
        this.pushUpdate({ structural: true });
    }

    private onStressChanged(stress: boolean): void {
        this.stressFirst = stress;
        this.pushUpdate();
    }

    private onSubdivisionChanged(subdivision: number[]): void {
        const structural = subdivision.length !== this.subdivision.length;
        this.subdivision = subdivision;
        this.pushUpdate({ structural });
    }

    private onWaveformChanged(waveform: Waveform): void {
        this.currentWaveform = waveform;
        this.pushUpdate();
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

    private onToggleMode(): void {
        if (this.isPlaying()) {
            this.stop();
            this.updateDisplay();
        }
    }

    private isPlaying(): boolean {
        return this.playing;
    }

    private play(): void {
        // play event must precede any beat event so DotModule clears first.
        bus.emit('play');
        this.playing = true;
        this.engine = selectPlaybackEngine();
        void this.startEngine();
    }

    private async startEngine(): Promise<void> {
        const engine = this.engine;
        if (!engine) {
            return;
        }

        // Register the listener first to avoid missing the first beat event
        // in the round-trip window before start() resolves.
        this.beatHandle = await engine.addBeatListener((beatIndex) => {
            if (this.playing && this.engine === engine) {
                bus.emit('beat', { beatIndex });
            }
        });

        if (!this.playing || this.engine !== engine) {
            await this.beatHandle?.remove();
            this.beatHandle = null;
            return;
        }

        const started = await engine.start(this.buildOptions());

        if (!this.playing || this.engine !== engine) {
            await this.beatHandle?.remove();
            this.beatHandle = null;
            if (started) {
                await engine.stop();
            }
        }
    }

    private stop(): void {
        this.playing = false;
        const engine = this.engine;
        const handle = this.beatHandle;
        this.engine = null;
        this.beatHandle = null;

        if (handle) {
            void handle.remove();
        }
        if (engine) {
            void engine.stop();
        }

        bus.emit('stop');
    }

    private pushUpdate(opts: { structural?: boolean } = {}): void {
        if (!this.playing || !this.engine) {
            return;
        }
        if (opts.structural) {
            // Engines reset to beat 0 on structural changes; clear the dot
            // so it stays blank until the next beat event arrives.
            bus.emit('play');
        }
        void this.engine.update(this.buildOptions());
    }

    private buildOptions(): PlaybackOptions {
        return {
            bpm: this.bpm,
            beats: this.beats,
            stressFirst: this.stressFirst,
            subdivision: this.subdivision,
            waveform: this.currentWaveform,
        };
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
