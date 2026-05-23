import type { PluginListenerHandle } from '@capacitor/core';

import { Speaker, Waveform } from '~/extensions/speaker';
import type { PlaybackEngine, PlaybackOptions } from '~/platform/native';

const TICK_FREQ = 1600;
const TOK_FREQ = 800;
const TAK_FREQ = 600;

type Listener = (beatIndex: number) => void;

/**
 * Web Audio playback engine. Mirrors the interface of the Android and iOS
 * native engines so the Player can stay backend-agnostic. The audio clock
 * here is a JS setInterval, so audio and beat-event are driven from the same
 * callback - no cross-clock drift on web.
 */
class WebPlaybackEngine implements PlaybackEngine {
    private speaker: Speaker;

    private bpm: number = 60;
    private beats: number = 4;
    private stressFirst: boolean = true;
    private subdivision: number[] = [1];
    private waveform: Waveform = 'square';

    private running: boolean = false;
    private currentBeat: number = 0;
    private currentNote: number = 0;
    private intervalHandle: number = -1;
    private listeners: Set<Listener> = new Set();

    constructor(speaker: Speaker) {
        this.speaker = speaker;
    }

    canUse(): boolean {
        return true;
    }

    async start(options: PlaybackOptions): Promise<boolean> {
        this.applyOptions(options);
        this.running = true;
        this.currentBeat = 0;
        this.currentNote = 0;
        this.tick();
        this.scheduleTicker();
        return true;
    }

    async update(options: PlaybackOptions): Promise<boolean> {
        const structural =
            this.running &&
            (options.beats !== this.beats || options.subdivision.length !== this.subdivision.length);
        this.applyOptions(options);
        if (!this.running) {
            return true;
        }
        if (structural) {
            this.currentBeat = 0;
            this.currentNote = 0;
            this.clearTicker();
            this.tick();
            this.scheduleTicker();
        } else {
            this.clearTicker();
            this.scheduleTicker();
        }
        return true;
    }

    async stop(): Promise<boolean> {
        this.running = false;
        this.clearTicker();
        return true;
    }

    async addBeatListener(handler: Listener): Promise<PluginListenerHandle | null> {
        this.listeners.add(handler);
        const remove = async () => {
            this.listeners.delete(handler);
        };
        return { remove };
    }

    private applyOptions(options: PlaybackOptions): void {
        this.bpm = options.bpm;
        this.beats = options.beats;
        this.stressFirst = options.stressFirst;
        this.subdivision = options.subdivision.length > 0 ? options.subdivision : [1];
        const requested = options.waveform as Waveform | undefined;
        if (requested) {
            this.waveform = requested;
        }
        this.speaker.setWaveform(this.waveform);
    }

    private scheduleTicker(): void {
        const delay = 60000.0 / (this.bpm * this.subdivision.length);
        this.intervalHandle = setInterval(() => this.tick(), delay);
    }

    private clearTicker(): void {
        if (this.intervalHandle !== -1) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = -1;
        }
    }

    private tick(): void {
        if (this.subdivision[this.currentNote] === 1) {
            if (this.isFirstBeat()) {
                this.speaker.play(this.stressFirst ? TICK_FREQ : TOK_FREQ);
            } else {
                this.speaker.play(this.isFirstNote() ? TOK_FREQ : TAK_FREQ);
            }
        }

        if (this.isFirstNote()) {
            const beatIndex = this.currentBeat;
            this.listeners.forEach((listener) => listener(beatIndex));
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
}

export function createWebPlaybackEngine(speaker: Speaker): PlaybackEngine {
    return new WebPlaybackEngine(speaker);
}
