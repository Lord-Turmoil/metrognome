import { SplashScreen } from '@capacitor/splash-screen';
import { Metronome } from './modules/metronome.js';

let metronome;

window.onload = () => {
    metronome = new Metronome();
    SplashScreen.hide();

    (function () {
        let beginYear = 2022;
        let currentYear = new Date().getFullYear();
        document.getElementById("year").innerHTML = beginYear + (beginYear === currentYear ? "" : " - " + currentYear);
    })();
};
