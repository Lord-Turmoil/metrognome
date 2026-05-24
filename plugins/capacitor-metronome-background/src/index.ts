import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

import type {
    MetronomeBackgroundPlugin,
    MetronomeBackgroundStartOptions,
    MetronomeBackgroundUpdateOptions,
    MetronomeBeatEvent,
} from './definitions';

/**
 * Raw bridge surface exposed by Capacitor's registerPlugin. Kept module-
 * private so callers go through the curated MetronomeBackground facade
 * below and don't need to know the wire event name 'beat'.
 */
interface NativePlugin {
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

const native = registerPlugin<NativePlugin>('MetronomeBackground');

export const MetronomeBackground: MetronomeBackgroundPlugin = {
    initialize: () => native.initialize(),
    isAvailable: () => native.isAvailable(),
    startPlayback: (options) => native.startPlayback(options),
    updatePlayback: (options) => native.updatePlayback(options),
    stopPlayback: () => native.stopPlayback(),
    addBeatListener: (listener) => native.addListener('beat', listener),
    removeAllListeners: () => native.removeAllListeners(),
};

export * from './definitions';
