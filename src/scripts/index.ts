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
import { Speaker } from '~/extensions/speaker';

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
    const PLATFORM_TO_BADGE = {
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

function attachPlatformModule(app: App, platform: string): void {
    if (platform === 'web') {
        import('~/platform/web').then((module) => {
            app.load(new module.default());
        });
    } else if (platform === 'android') {
        import('~/platform/android').then((module) => {
            app.load(new module.default());
        });
    } else if (platform === 'ios') {
        import('~/platform/ios').then((module) => {
            app.load(new module.default());
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    SafeAreaController.injectCSSVariables();

    const platform = Capacitor.getPlatform();
    displayBadge(platform);

    const app = launch();
    attachPlatformModule(app, platform);

    updateCopyright();

    if (platform === 'web') {
        const key = import.meta.env.VITE_CLARITY_KEY;
        if (key) {
            (function (c, l, a, r, i, t, y) {
                c[a] =
                    c[a] ||
                    function () {
                        (c[a].q = c[a].q || []).push(arguments);
                    };
                t = l.createElement(r);
                t.async = 1;
                t.src = 'https://www.clarity.ms/tag/' + i;
                y = l.getElementsByTagName(r)[0];
                y.parentNode.insertBefore(t, y);
            })(window, document, 'clarity', 'script', key);
        }
    }

    if (platform !== 'web') {
        document.getElementById('title').addEventListener('click', () => {
            window.open(import.meta.env.VITE_WEB_URL, '_blank');
        });
    }
});

window.onload = () => {
    hideSplash();

    window.onclick = async () => {
        try {
            await KeepAwake.keepAwake();
            window.onclick = null;
        } catch (error) {
            // Ignore error
        }
    };
};
