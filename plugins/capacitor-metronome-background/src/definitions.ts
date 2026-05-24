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
 * The plugin exposes a single domain event (one beat per beat boundary)
 * through `addBeatListener`. Subscribing returns a `PluginListenerHandle`
 * whose `remove()` tears down the native callback - no generic listener
 * API leaks to consumers.
 */
export interface MetronomeBackgroundPlugin {
    initialize(): Promise<{ available: boolean }>;
    isAvailable(): Promise<{ available: boolean }>;
    startPlayback(options: MetronomeBackgroundStartOptions): Promise<void>;
    updatePlayback(options: MetronomeBackgroundUpdateOptions): Promise<void>;
    stopPlayback(): Promise<void>;
    addBeatListener(listener: (event: MetronomeBeatEvent) => void): Promise<PluginListenerHandle>;
}
