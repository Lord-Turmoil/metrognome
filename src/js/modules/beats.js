import { LanguageManager } from "../language/language";
import { Storage } from "../storage";

/**
 * @module beats
 * This module handles the beats of the metronome.
 */
const MIN_BEATS = 1;
const MAX_BEATS = 8;
const DEFAULT_BEATS = 4;

class BeatsModule {
    /**
     * @param {LanguageManager} language Language manager.
     */
    constructor(language) {
        this.language = language;

        this.beats = DEFAULT_BEATS;
        this.stressFirst = true;

        this.beatsChangeListeners = [];

        this.input = document.getElementById("beats");
        this.controlList = document.getElementById("beats-ctrl").getElementsByTagName("button");
        this.stressButton = document.getElementById("stress");

        this.initCallbacks();

        this.load();
        this.setBeats(this.beats);
        this.setStressFirst(this.stressFirst);
    }

    /**
     * Set the beats value. (Internal use only)
     * @param {number} beats Beats per measure.
     */
    setBeats(beats) {
        if (beats < MIN_BEATS) {
            beats = MIN_BEATS;
        } else if (beats > MAX_BEATS) {
            beats = MAX_BEATS;
        }

        this.beats = beats;
        this.input.value = beats;

        this.notifyAll();
    }

    /**
     * Get the current beats.
     * @returns {boolean} The current beats.
     */
    getBeats() {
        return this.beats;
    }

    /**
     * Set first beat stress.
     * @param {boolean} stressFirst Whether the first beat is stressed or not.
     */
    setStressFirst(stressFirst) {
        this.stressFirst = stressFirst;
        if (this.stressFirst) {
            this.stressButton.setAttribute("data-i18n", "beats.stress.yes");
            this.stressButton.className = "yes"
        } else {
            this.stressButton.setAttribute("data-i18n", "beats.stress.no");
            this.stressButton.className = "no";
        }
        this.language.update();

        this.notifyAll();
    }

    /**
     * Get stress first value.
     * @returns {boolean} Whether the first beat is stressed or not.
     */
    getStressFirst() {
        return this.stressFirst;
    }

    /**
     * Add listeners for beats change.
     * The function will be called with the new beats value and the new stress first value.
     * @param {function} listener Event listener for beats change.
     */
    addBeatsChangeListeners(listener) {
        this.beatsChangeListeners.push(listener);
    }

    notifyAll() {
        this.beatsChangeListeners.forEach(listener => listener(this.beats, this.stressFirst));
    }

    initCallbacks() {
        (function (_this) {
            _this.controlList[0].onclick = function () {
                _this.setBeats(_this.beats - 1);
            }
            _this.controlList[1].onclick = function () {
                _this.setBeats(_this.beats + 1);
            }
            _this.input.onchange = function () {
                const beats = _this.input.value === "" ? _this.beats : parseInt(_this.input.value);
                _this.setBeats(beats);
            }
            _this.stressButton.onclick = function () {
                _this.setStressFirst(!_this.stressFirst);
            }
        })(this);
        this.addBeatsChangeListeners(() => this.save());
    }

    load() {
        this.beats = Storage.loadInt("beats", this.beats);
        this.stressFirst = Storage.loadBool("stressFirst", this.stressFirst);
    }

    save() {
        Storage.save("beats", this.beats);
        Storage.save("stressFirst", this.stressFirst);
    }
};

export { BeatsModule };
