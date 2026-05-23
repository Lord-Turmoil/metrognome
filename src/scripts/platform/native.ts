import type { PluginListenerHandle } from '@capacitor/core';
import type { MetronomeBackgroundStartOptions, MetronomeBackgroundUpdateOptions } from 'capacitor-metronome-background';

import { Speaker } from '~/extensions/speaker';
import {
    addAndroidBeatListener,
    androidPlaybackEngine,
    canUseAndroidNativePlayback,
    startAndroidNativePlayback,
    stopAndroidNativePlayback,
    updateAndroidNativePlayback,
} from '~/platform/android-native';
import {
    addIosBeatListener,
    canUseIosNativePlayback,
    iosPlaybackEngine,
    startIosNativePlayback,
    stopIosNativePlayback,
    updateIosNativePlayback,
} from '~/platform/ios-native';
import { createWebPlaybackEngine } from '~/platform/web-native';

export type PlaybackOptions = MetronomeBackgroundStartOptions;

/**
 * Unified contract every platform-specific playback backend implements.
 * The Player drives this interface without knowing whether it's talking to
 * the web Audio API, the Android foreground service, or the iOS audio engine.
 */
export interface PlaybackEngine {
    canUse(): boolean;
    start(options: PlaybackOptions): Promise<boolean>;
    update(options: PlaybackOptions): Promise<boolean>;
    stop(): Promise<boolean>;
    addBeatListener(handler: (beatIndex: number) => void): Promise<PluginListenerHandle | null>;
}

let webEngine: PlaybackEngine | null = null;

/**
 * Bind the shared Speaker into the web playback engine. Must be called once
 * during app startup, before any `selectPlaybackEngine()` consumer plays.
 */
export function configurePlaybackEngines(speaker: Speaker): void {
    webEngine = createWebPlaybackEngine(speaker);
}

/**
 * Return the first available engine in platform-preference order:
 * Android → iOS → web (universal fallback).
 */
export function selectPlaybackEngine(): PlaybackEngine {
    if (androidPlaybackEngine.canUse()) {
        return androidPlaybackEngine;
    }
    if (iosPlaybackEngine.canUse()) {
        return iosPlaybackEngine;
    }
    if (!webEngine) {
        throw new Error('Web playback engine not configured; call configurePlaybackEngines() first.');
    }
    return webEngine;
}

// --- legacy free-function facade (still used by Player; removed in the next commit) ---

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
