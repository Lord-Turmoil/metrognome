/**
 * @module metronome
 * The player that manage all modules.
 */

import { BpmModule } from "./bpm.js";
import { BeatsModule } from "./beats.js";
import { Player } from "./player.js";
import { SubdivisionModule } from "./subdivision.js";
import { WaveformModule } from "./waveform.js";
import { VersionModule } from "./version.js";
import { Speaker } from "../speaker.js";
import { LanguageManager } from "../language/language.js";

class Metronome {
    /**
     * @param {LanguageManager} language Language manager
     */
    constructor(language) {
        this.speaker = new Speaker();

        this.bpmModule = new BpmModule();
        this.beatsModule = new BeatsModule(language);
        this.subdivisionModule = new SubdivisionModule();
        this.waveformModule = new WaveformModule();
        this.versionModule = new VersionModule(language);

        this.player = new Player(this.speaker);
        this.language = language;

        this.configuration = {};
        this.updateConfiguration();

        this.control = document.getElementById("play");
        this.beatList = document.getElementById("dot-list");
        this.lastBeat = -1;

        this.initCallbacks();

        this.initBeats(this.beatsModule.getBeats());
    }

    /**
     * The configuration will be passed to the player.
     */
    updateConfiguration() {
        this.configuration = {
            bpm: this.bpmModule.getBpm(),
            beats: this.beatsModule.getBeats(),
            stressFirst: this.beatsModule.getStressFirst(),
            subdivision: this.subdivisionModule.getSubdivision(),
            waveform: this.waveformModule.getWaveform()
        };
    }

    /**
     * Play the metronome.
     */
    play() {
        this.control.setAttribute("data-i18n", "play.stop");
        this.language.update();
        this.control.className = "stop";
        this.player.play(this.configuration);
    }

    /**
     * Stop the metronome.
     */
    stop() {
        this.control.setAttribute("data-i18n", "play.play");
        this.language.update();
        this.control.className = "play";
        this.player.stop();
        this.deactivateBeat(this.lastBeat);
    }

    onConfigurationChange() {
        this.updateConfiguration();
        if (this.player.isPlaying()) {
            this.player.play(this.configuration);
        }
    }

    activateBeat(index) {
        if (index !== -1) {
            this.beatList.getElementsByTagName("li")[index].classList.add("active");
        }
    }

    deactivateBeat(index) {
        if (index !== -1) {
            this.beatList.getElementsByTagName("li")[index].classList.remove("active");
        }
    }

    initBeats(beats) {
        this.beatList.innerHTML = "";
        for (let i = 0; i < beats; i++) {
            const beat = document.createElement("li");
            beat.className = "dot";
            this.beatList.appendChild(beat);
        }
        this.activateBeat(this.lastBeat);
    }

    initCallbacks() {
        this.bpmModule.addBpmChangeListener(() => this.onConfigurationChange());
        this.beatsModule.addBeatsChangeListeners(() => this.onConfigurationChange());
        this.beatsModule.addBeatsChangeListeners((beats) => {
            this.initBeats(beats);
        });
        this.subdivisionModule.addSubdivisionChangeListeners(() => this.onConfigurationChange());
        this.waveformModule.addWaveformChangeListener(() => this.onConfigurationChange());
        this.player.addBeatChangeListener((beat) => {
            this.deactivateBeat(this.lastBeat);
            this.lastBeat = beat;
            this.activateBeat(beat);
        });
        (function (_this) {
            _this.control.onclick = () => {
                if (_this.player.isPlaying()) {
                    _this.stop();
                } else {
                    _this.play();
                }
            };
        })(this);
    }
};

export { Metronome };
