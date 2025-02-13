import { SplashScreen } from '@capacitor/splash-screen';
import { Metronome } from './modules/metronome.js';
import { KeepAwake } from '@capacitor-community/keep-awake';

let metronome;

window.onload = () => {
    metronome = new Metronome();
    SplashScreen.hide();

    (function () {
        let beginYear = 2022;
        let currentYear = new Date().getFullYear();
        document.getElementById("year").innerHTML = beginYear + (beginYear === currentYear ? "" : " - " + currentYear);
    })();

    (async () => {
        await KeepAwake.keepAwake();
    })();
};
