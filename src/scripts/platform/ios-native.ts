import { Capacitor } from '@capacitor/core';
import {
    MetronomeBackground,
    MetronomeBackgroundStartOptions,
    MetronomeBackgroundUpdateOptions,
} from 'capacitor-metronome-background';

let initialized = false;
let nativeReady = false;

function isIosPlatform(): boolean {
    return Capacitor.getPlatform() === 'ios';
}

export async function initializeIosNativePlayback(): Promise<void> {
    if (!isIosPlatform() || initialized) {
        return;
    }

    initialized = true;

    try {
        const result = await MetronomeBackground.initialize();
        nativeReady = !!result.available;
    } catch (error) {
        nativeReady = false;
        console.warn('[ios-native] Failed to initialize native metronome plugin', error);
    }
}

export function canUseIosNativePlayback(): boolean {
    return isIosPlatform() && nativeReady;
}

export async function startIosNativePlayback(options: MetronomeBackgroundStartOptions): Promise<boolean> {
    if (!canUseIosNativePlayback()) {
        return false;
    }

    try {
        await MetronomeBackground.startPlayback(options);
        return true;
    } catch (error) {
        nativeReady = false;
        console.warn('[ios-native] Failed to start native playback', error);
        return false;
    }
}

export async function updateIosNativePlayback(options: MetronomeBackgroundUpdateOptions): Promise<boolean> {
    if (!canUseIosNativePlayback()) {
        return false;
    }

    try {
        await MetronomeBackground.updatePlayback(options);
        return true;
    } catch (error) {
        nativeReady = false;
        console.warn('[ios-native] Failed to update native playback', error);
        return false;
    }
}

export async function stopIosNativePlayback(): Promise<boolean> {
    if (!isIosPlatform()) {
        return false;
    }

    try {
        await MetronomeBackground.stopPlayback();
        return true;
    } catch (error) {
        console.warn('[ios-native] Failed to stop native playback', error);
        return false;
    }
}
