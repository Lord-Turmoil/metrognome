/**
 * @module tap
 * This module handles the tap feature of the metronome.
 */
import {Speaker} from "../speaker";

// standard la frequency
const TAP_FREQ = 2000;

class TapModule {
    /**
     * @param {Speaker} speaker
     */
    constructor(speaker) {
        this.speaker = speaker;

        this.currentBpm = 0;
        this.isFirstTap = false;
        this.lastTapTimestamp = 0;
    }

    /**
     * Begin a tap session.
     */
    beginTap(bpm) {
        this.currentBpm = bpm;
        this.isFirstTap = true;
    }

    /**
     * Handle a tap event.
     *
     * @returns {number} The calculated BPM based on the tap interval.
     */
    tap() {
        this.speaker.play(TAP_FREQ);

        if (this.isFirstTap) {
            this.isFirstTap = false;
            this.lastTapTimestamp = Date.now();
            return this.currentBpm;
        }

        const currentTimestamp = Date.now();
        const interval = currentTimestamp - this.lastTapTimestamp;
        this.lastTapTimestamp = currentTimestamp;

        const bpm = Math.round(60000 / interval);

        // ease the transition to the new BPM
        this.currentBpm = Math.ceil(this.currentBpm * 0.9 + bpm * 0.1)

        // clamp within 30 to 240
        if (this.currentBpm < 30) {
            this.currentBpm = 30;
        } else if (this.currentBpm > 240) {
            this.currentBpm = 240;
        }

        return this.currentBpm;
    }
}

export {TapModule};