/**
 * @module subdivision
 * This module handles the subdivision of the metronome.
 */

import {Storage} from "../storage";

const SUBDIVISION = [
    [1],            // 4
    [1, 1],         // 8-8
    [1, 0, 1, 1],   // 8-16-16
    [1, 1, 1, 0],   // 16-16-8
    [1, 1, 1, 1],   // 16-16-16-16
    [1, 1, 1],      // triplet-8
    [1, 0, 0, 1],   // 8dot-16
    [1, 1, 0, 0],   // 16-8dot
];

const DEFAULT_SUBDIVISION_ID = 0;
const MIN_SUBDIVISION_ID = 0;
const MAX_SUBDIVISION_ID = SUBDIVISION.length - 1;

class SubdivisionModule {
    constructor() {
        this.subdivisionId = DEFAULT_SUBDIVISION_ID;

        this.subdivisionChangeListeners = [];

        this.controlList = document.getElementById("sub-box").getElementsByClassName("sub-item");

        this.initCallbacks();

        this.load();
        this.setSubdivisionById(this.subdivisionId);
    }

    /**
     * Set the subdivision value. (Internal use only)
     * @param {number} subdivisionId Subdivision ID.
     */
    setSubdivisionById(subdivisionId) {
        if (subdivisionId < MIN_SUBDIVISION_ID) {
            subdivisionId = MIN_SUBDIVISION_ID;
        } else if (subdivisionId > MAX_SUBDIVISION_ID) {
            subdivisionId = MAX_SUBDIVISION_ID;
        }

        this.controlList[this.subdivisionId].classList.remove("active");
        this.subdivisionId = subdivisionId;
        this.controlList[this.subdivisionId].classList.add("active");

        this.notifyAll();
    }

    /**
     * Get the subdivision value.
     */
    getSubdivision() {
        return SUBDIVISION[this.subdivisionId];
    }

    /**
     * Add listeners for subdivision change.
     * @param {function} listener Subdivision change listener.
     */
    addSubdivisionChangeListeners(listener) {
        this.subdivisionChangeListeners.push(listener);
    }

    notifyAll() {
        this.subdivisionChangeListeners.forEach(listener => listener(this.subdivisionId));
    }

    initCallbacks() {
        for (let i = 0; i < this.controlList.length; i++) {
            (function (_this, _i) {
                _this.controlList[_i].onclick = function () {
                    _this.setSubdivisionById(_i);
                };
            })(this, i);
        }
        this.addSubdivisionChangeListeners(() => this.save());
    }

    load() {
        this.subdivisionId = Storage.loadInt("subdivision", this.subdivisionId);
    }

    save() {
        Storage.save("subdivision", this.subdivisionId);
    }
}

export {SubdivisionModule};
