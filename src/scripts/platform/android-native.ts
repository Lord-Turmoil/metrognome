import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import {
    MetronomeBackground,
    MetronomeBackgroundStartOptions,
    MetronomeBackgroundUpdateOptions,
} from 'capacitor-metronome-background';

import type { PlaybackEngine, PlaybackOptions } from '~/platform/native';

let initialized = false;
let nativeReady = false;

function isAndroidPlatform(): boolean {
    return Capacitor.getPlatform() === 'android';
}

export async function initializeAndroidNativePlayback(): Promise<void> {
    if (!isAndroidPlatform() || initialized) {
        return;
    }

    initialized = true;

    try {
        const result = await MetronomeBackground.initialize();
        nativeReady = !!result.available;
    } catch (error) {
        nativeReady = false;
        console.warn('[android-native] Failed to initialize native metronome plugin', error);
    }
}

function canUseAndroidNativePlayback(): boolean {
    return isAndroidPlatform() && nativeReady;
}

async function startAndroidNativePlayback(options: MetronomeBackgroundStartOptions): Promise<boolean> {
    if (!canUseAndroidNativePlayback()) {
        return false;
    }

    try {
        await MetronomeBackground.startPlayback(options);
        return true;
    } catch (error) {
        nativeReady = false;
        console.warn('[android-native] Failed to start native playback', error);
        return false;
    }
}

async function updateAndroidNativePlayback(options: MetronomeBackgroundUpdateOptions): Promise<boolean> {
    if (!canUseAndroidNativePlayback()) {
        return false;
    }

    try {
        await MetronomeBackground.updatePlayback(options);
        return true;
    } catch (error) {
        nativeReady = false;
        console.warn('[android-native] Failed to update native playback', error);
        return false;
    }
}

async function stopAndroidNativePlayback(): Promise<boolean> {
    if (!isAndroidPlatform()) {
        return false;
    }

    try {
        await MetronomeBackground.stopPlayback();
        return true;
    } catch (error) {
        console.warn('[android-native] Failed to stop native playback', error);
        return false;
    }
}

async function addAndroidBeatListener(
    handler: (beatIndex: number) => void
): Promise<PluginListenerHandle | null> {
    if (!canUseAndroidNativePlayback()) {
        return null;
    }

    try {
        return await MetronomeBackground.addListener('beat', (event) => handler(event.beatIndex));
    } catch (error) {
        console.warn('[android-native] Failed to add beat listener', error);
        return null;
    }
}

export const androidPlaybackEngine: PlaybackEngine = {
    canUse: canUseAndroidNativePlayback,
    start: (options: PlaybackOptions) => startAndroidNativePlayback(options),
    update: (options: PlaybackOptions) => updateAndroidNativePlayback(options),
    stop: stopAndroidNativePlayback,
    addBeatListener: addAndroidBeatListener,
};
