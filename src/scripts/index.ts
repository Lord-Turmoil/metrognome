import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

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
    const badge = document.getElementById('badge') as HTMLSpanElement;
    badge.innerText = platform;
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const platform = Capacitor.getPlatform();
    displayBadge(platform);

    const app = launch();
    attachPlatformModule(app, platform);

    updateCopyright();
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
