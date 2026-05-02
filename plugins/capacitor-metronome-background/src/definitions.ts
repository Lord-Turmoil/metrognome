export interface MetronomeBackgroundStartOptions {
    bpm: number;
    beats: number;
    stressFirst: boolean;
    subdivision: number[];
    waveform?: string;
}

export type MetronomeBackgroundUpdateOptions = MetronomeBackgroundStartOptions;

export interface MetronomeBackgroundPlugin {
    initialize(): Promise<{ available: boolean }>;
    isAvailable(): Promise<{ available: boolean }>;
    startPlayback(options: MetronomeBackgroundStartOptions): Promise<void>;
    updatePlayback(options: MetronomeBackgroundUpdateOptions): Promise<void>;
    stopPlayback(): Promise<void>;
}
