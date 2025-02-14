/**
 * @module waveform
 * This module handles the waveform type.
 */

import { Storage } from "../storage";

const WAVEFORM = [
    "square",
    "sawtooth",
    "sine",
    "triangle"
];

const DEFAULT_WAVEFORM_ID = 0;
const MIN_WAVEFORM_ID = 0;
const MAX_WAVEFORM_ID = WAVEFORM.length - 1;

class WaveformModule {
    constructor() {
        this.waveformId = DEFAULT_WAVEFORM_ID;

        this.waveformChangeListeners = [];

        this.controlList = document.getElementById("wave-list").getElementsByClassName("wave-item");

        this.initCallbacks();

        this.load();
        this.setWaveformById(this.waveformId);
    }

    /**
     * Set the waveform by ID. (Internal use only)
     * @param {number} waveformId Waveform ID.
     */
    setWaveformById(waveformId) {
        if (waveformId < MIN_WAVEFORM_ID) {
            waveformId = MIN_WAVEFORM_ID;
        } else if (waveformId > MAX_WAVEFORM_ID) {
            waveformId = MAX_WAVEFORM_ID;
        }

        this.controlList[this.waveformId].classList.remove("active");
        this.waveformId = waveformId;
        this.controlList[this.waveformId].classList.add("active");

        this.notifyAll();
    }

    getWaveform() {
        return WAVEFORM[this.waveformId];
    }

    /**
     * Add a listener to the waveform change event
     * @param {function} listener Listener function.
     */
    addWaveformChangeListener(listener) {
        this.waveformChangeListeners.push(listener);
    }

    notifyAll() {
        this.waveformChangeListeners.forEach(listener => listener(this.waveformId));
    }

    initCallbacks() {
        for (var i = 0; i < this.controlList.length; i++) {
            (function (_this, _i) {
                _this.controlList[_i].onclick = function () {
                    _this.setWaveformById(_i);
                };
            })(this, i);
        }
        this.addWaveformChangeListener(() => this.save());
    }

    load() {
        this.waveformId = Storage.loadInt("waveform", this.waveformId);
    }

    save() {
        Storage.save("waveform", this.waveformId);
    }
};

export { WaveformModule };
