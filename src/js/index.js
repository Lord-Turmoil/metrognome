import { SplashScreen } from '@capacitor/splash-screen';
import { Metronome } from './modules/metronome.js';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Capacitor } from '@capacitor/core';
import { LanguageManager } from './language/language.js';

let metronome;
let language;

function hideSplash() {
    document.getElementById("splash").style.display = "none";
    document.getElementById("content").style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
    SplashScreen.hide();
    language = new LanguageManager();
});

window.onload = () => {
    metronome = new Metronome(language);

    hideSplash();

    (function () {
        let beginYear = 2022;
        let currentYear = new Date().getFullYear();
        document.getElementById("year").innerHTML = beginYear + (beginYear === currentYear ? "" : " - " + currentYear);
    })();

    window.onclick = () => {
        (async () => {
            await KeepAwake.keepAwake();
        })();
        window.onclick = null;
    };

    const platform = Capacitor.getPlatform();
    document.getElementById(`platform-${platform}`).style.display = "block";
};
