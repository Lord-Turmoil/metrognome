import type { PluginListenerHandle } from '@capacitor/core';

export interface MetronomeBackgroundStartOptions {
    bpm: number;
    beats: number;
    stressFirst: boolean;
    subdivision: number[];
    waveform?: string;
}

export type MetronomeBackgroundUpdateOptions = MetronomeBackgroundStartOptions;

export interface MetronomeBeatEvent {
    beatIndex: number;
}

/**
 * Curated public surface for the native metronome background plugin.
 *
 * The native code emits `notifyListeners("beat", ...)` on every beat
 * boundary; rather than expose Capacitor's generic `addListener` overload
 * and force callers to know the wire event name, this interface presents
 * a named `addBeatListener` instead. The underlying bridge subscription is
 * an implementation detail of the wrapper in `index.ts`.
 */
export interface MetronomeBackgroundPlugin {
    initialize(): Promise<{ available: boolean }>;
    isAvailable(): Promise<{ available: boolean }>;
    startPlayback(options: MetronomeBackgroundStartOptions): Promise<void>;
    updatePlayback(options: MetronomeBackgroundUpdateOptions): Promise<void>;
    stopPlayback(): Promise<void>;
    addBeatListener(listener: (event: MetronomeBeatEvent) => void): Promise<PluginListenerHandle>;
    removeAllListeners(): Promise<void>;
}
