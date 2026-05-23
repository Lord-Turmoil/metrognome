import type { PluginListenerHandle } from '@capacitor/core';
import {
    addAndroidBeatListener,
    canUseAndroidNativePlayback,
    startAndroidNativePlayback,
    stopAndroidNativePlayback,
    updateAndroidNativePlayback,
} from '~/platform/android-native';
import {
    addIosBeatListener,
    canUseIosNativePlayback,
    startIosNativePlayback,
    stopIosNativePlayback,
    updateIosNativePlayback,
} from '~/platform/ios-native';
import type { MetronomeBackgroundStartOptions, MetronomeBackgroundUpdateOptions } from 'capacitor-metronome-background';

/**
 * Unified facade over the per-platform native playback backends.
 * Player code stays platform-agnostic: it asks for availability, then
 * delegates start/update/stop. Each call returns false on failure so the
 * caller can transparently fall back to the Web Audio backend.
 */
export function canUseNativePlayback(): boolean {
    return canUseAndroidNativePlayback() || canUseIosNativePlayback();
}

export async function startNativePlayback(options: MetronomeBackgroundStartOptions): Promise<boolean> {
    if (canUseAndroidNativePlayback()) {
        return startAndroidNativePlayback(options);
    }
    if (canUseIosNativePlayback()) {
        return startIosNativePlayback(options);
    }
    return false;
}

export async function updateNativePlayback(options: MetronomeBackgroundUpdateOptions): Promise<boolean> {
    if (canUseAndroidNativePlayback()) {
        return updateAndroidNativePlayback(options);
    }
    if (canUseIosNativePlayback()) {
        return updateIosNativePlayback(options);
    }
    return false;
}

export async function stopNativePlayback(): Promise<boolean> {
    // Stop both - whichever was active will succeed; the other no-ops.
    const results = await Promise.all([stopAndroidNativePlayback(), stopIosNativePlayback()]);
    return results.some((ok) => ok);
}

export async function addNativeBeatListener(
    handler: (beatIndex: number) => void
): Promise<PluginListenerHandle | null> {
    if (canUseAndroidNativePlayback()) {
        return addAndroidBeatListener(handler);
    }
    if (canUseIosNativePlayback()) {
        return addIosBeatListener(handler);
    }
    return null;
}
