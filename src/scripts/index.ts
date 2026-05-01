import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { SafeAreaController } from '@aashu-dubey/capacitor-statusbar-safe-area';

import Metrognome from '~/metrognome';
import LanguageManager from '~/language/language';

import BpmModule from '~/modules/bpm';
import DotModule from '~/modules/dot';
import Player from '~/modules/player';
import TapModule from '~/modules/tap';
import BeatsModule from '~/modules/beats';
import SoundModule from '~/modules/sound';
import SubdivisionModule from '~/modules/subdivision';

import { App } from '~/extensions/module';
import type { Module } from '~/extensions/module';
import { Speaker } from '~/extensions/speaker';
import { SupportedPlatform, PLATFORM_ELEMENT_IDS } from '~/platform/config';
import { getElementByIdOrThrow } from '~/extensions/dom';

const IONIC_PWA_SCRIPT_URLS = [
    'https://tonys-studio-1308383348.cos.ap-beijing.myqcloud.com/apps/metrognome/static/ionicpwaelements.esm.js',
    'https://tonys-studio-1308383348.cos.ap-beijing.myqcloud.com/apps/metrognome/static/ionicpwaelements.js',
];

function hideSplash(): void {
    const splash = document.getElementById('splash');
    if (splash) {
        splash.style.display = 'none';
    }

    const app = document.getElementById('app');
    if (app) {
        app.style.display = 'block';
    }
}

function updateCopyright(): void {
    const beginYear = 2022;
    const currentYear = new Date().getFullYear();
    const yearElement = document.getElementById('year') as HTMLSpanElement;
    yearElement.innerHTML = beginYear + (beginYear === currentYear ? '' : ' - ' + currentYear);
}

function displayBadge(platform: string): void {
    const PLATFORM_TO_BADGE: Record<string, string> = {
        web: 'Web',
        android: 'Android',
        ios: 'iOS',
    };
    const badge = document.getElementById('badge') as HTMLSpanElement;
    badge.innerText = PLATFORM_TO_BADGE[platform] || 'Other';
    badge.classList.add(platform);
}

function launch(): App {
    const speaker = new Speaker();
    return new Metrognome()
        .load(new LanguageManager())
        .load(new Player(speaker))
        .load(new TapModule(speaker))
        .load(new DotModule())
        .load(new BpmModule())
        .load(new BeatsModule())
        .load(new SubdivisionModule())
        .load(new SoundModule());
}

type PlatformModuleImport = {
    default: new () => Module;
};

const PLATFORM_LOADERS: Record<SupportedPlatform, () => Promise<PlatformModuleImport>> = {
    web: () => import('~/platform/web'),
    android: () => import('~/platform/android'),
    ios: () => import('~/platform/ios'),
};

function attachPlatformModule(app: App, platform: string): void {
    const loader = PLATFORM_LOADERS[platform as SupportedPlatform];
    if (!loader) {
        return;
    }

    loader()
        .then((module) => {
            app.load(new module.default());
        })
        .catch((error: unknown) => {
            console.error(`[platform] Failed to load module for ${platform}`, error);
        });
}

function loadIonicPwaElementsDeferred(): void {
    const injectScripts = () => {
        IONIC_PWA_SCRIPT_URLS.forEach((url) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.async = true;
            script.src = url;
            document.head.appendChild(script);
        });
    };

    if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(injectScripts);
        return;
    }

    setTimeout(injectScripts, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    SafeAreaController.injectCSSVariables();

    const platform = Capacitor.getPlatform();
    getElementByIdOrThrow<HTMLElement>('app').classList.add(platform);

    displayBadge(platform);

    const app = launch();
    attachPlatformModule(app, platform);

    updateCopyright();

    // Do not wait for full onload (fonts/images/remote scripts) before showing app UI.
    hideSplash();
    loadIonicPwaElementsDeferred();

    window.onclick = async () => {
        try {
            await KeepAwake.keepAwake();
            window.onclick = null;
        } catch (error) {
            // Ignore error
        }
    };

    if (platform === 'web') {
        const key = import.meta.env.VITE_CLARITY_KEY;
        if (key) {
            (function (c: Record<string, any>, l: Document, a: string, r: string, i: string) {
                c[a] =
                    c[a] ||
                    function () {
                        (c[a].q = c[a].q || []).push(arguments);
                    };
                const t = l.createElement(r) as HTMLScriptElement;
                t.async = true;
                t.src = 'https://www.clarity.ms/tag/' + i;
                const y = l.getElementsByTagName(r)[0];
                y.parentNode?.insertBefore(t, y);
            })(window as unknown as Record<string, any>, document, 'clarity', 'script', key);
        }
    }

    if (platform !== 'web') {
        getElementByIdOrThrow<HTMLElement>(PLATFORM_ELEMENT_IDS.title).addEventListener('click', () => {
            window.open(import.meta.env.VITE_WEB_URL, '_blank');
        });
    }
});
