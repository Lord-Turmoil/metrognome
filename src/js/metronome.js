/**
 * @module metronome
 * The player that manage all modules.
 */

import {Speaker} from "./speaker.js";
import {BpmModule} from "./modules/bpm.js";
import {TapModule} from "./modules/tap.js";
import {Player} from "./modules/player.js";
import {BeatsModule} from "./modules/beats.js";
import {VersionModule} from "./modules/version.js";
import {CounterModule} from "./modules/counter.js";
import {WaveformModule} from "./modules/waveform.js";
import {LanguageManager} from "./language/language.js";
import {SubdivisionModule} from "./modules/subdivision.js";

class Metronome {
    /**
     * @param {LanguageManager} language Language manager
     */
    constructor(language) {
        this.speaker = new Speaker();

        this.bpmModule = new BpmModule();
        this.tapModule = new TapModule(this.speaker);
        this.beatsModule = new BeatsModule(language);
        this.subdivisionModule = new SubdivisionModule();
        this.waveformModule = new WaveformModule();
        this.versionModule = new VersionModule(language);
        this.counterModule = CounterModule.createPlatformSpecificInstance();

        this.player = new Player(this.speaker);
        this.language = language;

        this.configuration = {};
        this.updateConfiguration();

        this.speaker.setWaveform(this.waveformModule.getWaveform());

        this.playButton = document.getElementById("play");
        this.tapButton = document.getElementById("tap");
        this.switchButton = document.getElementById("switch");
        this.currentMode = "play";

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
            subdivision: this.subdivisionModule.getSubdivision()
        };
    }

    /**
     * Play the metronome.
     */
    play() {
        this.playButton.setAttribute("data-i18n", "play.stop");
        this.language.update();
        this.playButton.classList.remove("stopped");
        this.playButton.classList.add("playing");
        this.player.play(this.configuration);
    }

    /**
     * Stop the metronome.
     */
    stop() {
        this.playButton.setAttribute("data-i18n", "play.play");
        this.language.update();
        this.playButton.classList.remove("playing");
        this.playButton.classList.add("stopped");
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

    startTap() {
        this.tapModule.beginTap(this.bpmModule.getBpm());
    }

    stopTap() {
    }

    tap() {
        this.bpmModule.setBpm(this.tapModule.tap());
    }

    switchMode() {
        if (this.currentMode === "play") {
            this.playButton.style.display = "none";
            this.tapButton.style.display = "block";
            this.stop();
            this.startTap();
            this.currentMode = "tap";
        } else {
            this.playButton.style.display = "block";
            this.tapButton.style.display = "none";
            this.stopTap();
            this.currentMode = "play";
        }
    }

    initCallbacks() {
        this.bpmModule.addBpmChangeListener(() => this.onConfigurationChange());
        this.beatsModule.addBeatsChangeListeners(() => this.onConfigurationChange());
        this.beatsModule.addBeatsChangeListeners((beats) => {
            this.initBeats(beats);
        });
        this.subdivisionModule.addSubdivisionChangeListeners(() => this.onConfigurationChange());
        this.waveformModule.addWaveformChangeListener(() => this.speaker.setWaveform(this.waveformModule.getWaveform()));
        this.waveformModule.addWaveformChangeListener(() => this.onConfigurationChange());
        this.player.addBeatChangeListener((beat) => {
            this.deactivateBeat(this.lastBeat);
            this.lastBeat = beat;
            this.activateBeat(beat);
        });
        (function (_this) {
            _this.playButton.onclick = () => {
                if (_this.player.isPlaying()) {
                    _this.stop();
                } else {
                    _this.play();
                }
            };
            _this.tapButton.onclick = () => {
                _this.tap();
            }
            _this.switchButton.onclick = () => {
                _this.switchMode();
            }
        })(this);
        this.versionModule.addDownloadListener(async (platform, action) => {
            await this.counterModule.increase(platform, action);
        });
    }
}

export {Metronome};
