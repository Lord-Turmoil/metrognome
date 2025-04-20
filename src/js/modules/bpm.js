/**
 * @module bpm
 * This module handles the BPM (Beats Per Minute) of the metronome.
 */

import { Storage } from "../storage";

const MIN_BPM = 1;
const MAX_BPM = 240;
const LIMITED_MIN_BPM = 30;
const LIMITED_MAX_BPM = 240;
const DEFAULT_BPM = 60;

class BpmModule {
    constructor() {
        this.bpm = DEFAULT_BPM;
        this.maxBpm = LIMITED_MAX_BPM;
        this.minBpm = LIMITED_MIN_BPM;

        this.bpmChangeListeners = [];

        this.input = document.getElementById("bpm");
        this.controlList = document.getElementById("bpm-ctrl").getElementsByTagName("button");

        this.initCallbacks();

        this.load();
        this.setBpm(this.bpm);
    }

    /**
     * Set BPM limit.
     * @param {boolean} limited Whether limit BPM to a more common range or not.
     */
    setLimitedBpm(limited) {
        if (limited) {
            this.minBpm = LIMITED_MIN_BPM;
            this.maxBpm = LIMITED_MAX_BPM;
        } else {
            this.minBpm = MIN_BPM;
            this.maxBpm = MAX_BPM;
        }
    }

    /**
     * Set the BPM value. (Internal use only)
     * @param {number} bpm The BPM value.
     */
    setBpm(bpm) {
        if (bpm < this.minBpm) {
            bpm = this.minBpm;
        } else if (bpm > this.maxBpm) {
            bpm = this.maxBpm;
        }

        this.bpm = bpm;
        this.input.value = bpm;

        this.notifyAll();
    }

    /**
     * Get the BPM value.
     * @returns {number} The BPM value.
     */
    getBpm() {
        return this.bpm;
    }

    /**
     * Add listener to the BPM change event.
     * The callback takes the new BPM value as an argument
     * @param {function} listener
     */
    addBpmChangeListener(listener) {
        this.bpmChangeListeners.push(listener);
    }

    notifyAll() {
        this.bpmChangeListeners.forEach(listener => listener(this.bpm));
    }

    initCallbacks() {
        (function (_this) {
            _this.controlList[0].onclick = function () {
                _this.setBpm(_this.bpm - 5);
            };
            _this.controlList[1].onclick = function () {
                _this.setBpm(_this.bpm - 1);
            };
            _this.controlList[2].onclick = function () {
                _this.setBpm(_this.bpm + 1);
            };
            _this.controlList[3].onclick = function () {
                _this.setBpm(_this.bpm + 5);
            };
            _this.input.onchange = function () {
                const bpm = _this.input.value === "" ? _this.bpm : parseInt(_this.input.value);
                _this.setBpm(bpm);
            }
        })(this);
        this.addBpmChangeListener(() => this.save());
    }

    load() {
        this.bpm = Storage.loadInt("bpm", this.bpm);
    }

    save() {
        Storage.save("bpm", this.bpm);
    }
}

export { BpmModule };
