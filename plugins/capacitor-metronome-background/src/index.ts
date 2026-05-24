import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

import type {
    MetronomeBackgroundPlugin,
    MetronomeBackgroundStartOptions,
    MetronomeBackgroundUpdateOptions,
    MetronomeBeatEvent,
} from './definitions';

/**
 * Raw bridge surface exposed by Capacitor's registerPlugin. The native
 * plugins implement addBeatListener as a kept-alive callback method and
 * pair it with removeBeatListener for teardown - we wrap the two-step
 * pattern into a PluginListenerHandle in the facade below.
 */
interface NativePlugin {
    initialize(): Promise<{ available: boolean }>;
    isAvailable(): Promise<{ available: boolean }>;
    startPlayback(options: MetronomeBackgroundStartOptions): Promise<void>;
    updatePlayback(options: MetronomeBackgroundUpdateOptions): Promise<void>;
    stopPlayback(): Promise<void>;
    addBeatListener(listener: (event: MetronomeBeatEvent) => void): Promise<string>;
    removeBeatListener(options: { callbackId: string }): Promise<void>;
}

const native = registerPlugin<NativePlugin>('MetronomeBackground');

export const MetronomeBackground: MetronomeBackgroundPlugin = {
    initialize: () => native.initialize(),
    isAvailable: () => native.isAvailable(),
    startPlayback: (options) => native.startPlayback(options),
    updatePlayback: (options) => native.updatePlayback(options),
    stopPlayback: () => native.stopPlayback(),
    addBeatListener: async (listener): Promise<PluginListenerHandle> => {
        const callbackId = await native.addBeatListener(listener);
        return {
            remove: async () => {
                await native.removeBeatListener({ callbackId });
            },
        };
    },
};

export * from './definitions';
