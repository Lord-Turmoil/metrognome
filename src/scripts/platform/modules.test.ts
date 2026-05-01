import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Api from '~/extensions/api';
import { CURRENT_VERSION } from '~/models';
import AndroidModule from '~/platform/android';
import IosModule from '~/platform/ios';
import WebModule from '~/platform/web';

function setupWebDom(): void {
    document.body.innerHTML = `
        <div id="version-wrapper" class="expandable"></div>
        <div id="version-web" style="display:none"></div>
        <span class="version-text"></span>
        <button id="web-download-android"></button>
        <button id="web-download-ios"></button>
        <ul class="changelog web"></ul>
    `;
}

function setupAndroidDom(): void {
    document.body.innerHTML = `
        <div id="version-wrapper" class="expandable"></div>
        <div id="version-android" style="display:none"></div>
        <span class="version-text-current"></span>
        <span class="version-text-latest"></span>
        <div id="android-update" style="display:none"></div>
        <div id="android-latest" style="display:none"></div>
        <button id="android-download-update"></button>
        <h1 id="title"></h1>
        <ul class="changelog android"></ul>
    `;
}

function setupIosDom(): void {
    document.body.innerHTML = `
        <div id="version-wrapper" style="display:block"></div>
        <h1 id="title"></h1>
    `;
}

describe('platform module rendering', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('renders web version info and changelog when metadata is valid', async () => {
        setupWebDom();

        vi.spyOn(Api, 'fetch')
            .mockResolvedValueOnce({
                status: 'ok',
                data: {
                    latest: '1.4.6',
                    versions: ['1.4.6'],
                },
            })
            .mockResolvedValueOnce({
                status: 'ok',
                data: {
                    date: '2025-10-01',
                    changelog: [{ en: 'fix issue', zh: '修复问题' }],
                    android: 'https://example.com/app.apk',
                },
            });

        const web = new WebModule();
        await (web as unknown as { attach: () => Promise<void> }).attach();
        await vi.runAllTimersAsync();

        const versionText = document.querySelector('.version-text') as HTMLElement;
        const webSection = document.getElementById('version-web') as HTMLElement;
        const wrapper = document.getElementById('version-wrapper') as HTMLElement;
        const changelog = document.querySelector('.changelog.web') as HTMLUListElement;
        const androidDownloadButton = document.getElementById('web-download-android') as HTMLButtonElement;

        expect(versionText.textContent).toBe('1.4.6');
        expect(webSection.style.display).toBe('block');
        expect(wrapper.classList.contains('expand')).toBe(true);
        expect(changelog.children.length).toBe(1);
        expect(typeof androidDownloadButton.onclick).toBe('function');
    });

    it('renders android update state when remote version is newer', async () => {
        setupAndroidDom();

        vi.spyOn(Api, 'fetch')
            .mockResolvedValueOnce({
                status: 'ok',
                data: {
                    latest: '1.5.0',
                    versions: ['1.5.0', '1.4.6'],
                },
            })
            .mockResolvedValueOnce({
                status: 'ok',
                data: {
                    date: '2025-10-01',
                    changelog: [{ en: 'new update' }],
                    android: 'https://example.com/update.apk',
                },
            });

        const android = new AndroidModule();
        await (android as unknown as { attach: () => Promise<void> }).attach();
        await vi.runAllTimersAsync();

        const updateBanner = document.getElementById('android-update') as HTMLElement;
        const latestBanner = document.getElementById('android-latest') as HTMLElement;
        const currentVersion = document.querySelector('.version-text-current') as HTMLElement;
        const latestVersion = document.querySelector('.version-text-latest') as HTMLElement;
        const changelog = document.querySelector('.changelog.android') as HTMLUListElement;

        expect(updateBanner.style.display).toBe('block');
        expect(latestBanner.style.display).toBe('none');
        expect(currentVersion.textContent).toBe(CURRENT_VERSION);
        expect(latestVersion.textContent).toBe('1.5.0');
        expect(changelog.children.length).toBe(1);
    });

    it('hides version wrapper on ios attach', async () => {
        setupIosDom();

        const ios = new IosModule();
        await (ios as unknown as { attach: () => Promise<void> }).attach();

        const wrapper = document.getElementById('version-wrapper') as HTMLElement;
        const title = document.getElementById('title') as HTMLElement;

        expect(wrapper.style.display).toBe('none');
        expect(typeof title.onclick).toBe('function');
    });

    it('shows disconnected placeholder when web metadata fetch fails', async () => {
        setupWebDom();

        vi.spyOn(Api, 'fetch').mockResolvedValueOnce({
            status: 'network-error',
        });

        const web = new WebModule();
        await (web as unknown as { attach: () => Promise<void> }).attach();
        await vi.runAllTimersAsync();

        const wrapper = document.getElementById('version-wrapper') as HTMLElement;
        const webSection = document.getElementById('version-web') as HTMLElement;
        const placeholder = webSection.querySelector('[data-meta-placeholder="disconnected"]') as HTMLElement;
        const downloadAndroid = document.getElementById('web-download-android') as HTMLButtonElement;

        expect(wrapper.classList.contains('expand')).toBe(true);
        expect(webSection.style.display).toBe('block');
        expect(placeholder.textContent).toContain('Disconnected');
        expect(downloadAndroid.disabled).toBe(true);
    });
});
