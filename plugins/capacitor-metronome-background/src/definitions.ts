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

export interface MetronomeBackgroundPlugin {
    initialize(): Promise<{ available: boolean }>;
    isAvailable(): Promise<{ available: boolean }>;
    startPlayback(options: MetronomeBackgroundStartOptions): Promise<void>;
    updatePlayback(options: MetronomeBackgroundUpdateOptions): Promise<void>;
    stopPlayback(): Promise<void>;
    addListener(
        eventName: 'beat',
        listener: (event: MetronomeBeatEvent) => void
    ): Promise<PluginListenerHandle> & PluginListenerHandle;
    removeAllListeners(): Promise<void>;
}
