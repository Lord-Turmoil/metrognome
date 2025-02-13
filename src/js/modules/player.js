/**
 * @module player
 * The player that plays the metronome.
 */

import { Speaker } from "../speaker";

const TICK_FREQ = 1600;
const TOK_FREQ = 800;
const TAK_FREQ = 600;

class Player {
    /**
     * Create a new player.
     * @param {Speaker} speaker The speaker that plays the sound.
     */
    constructor(speaker) {
        this.speaker = speaker;
        this.beatChangeListeners = [];

        // configuration properties
        this.beats = 4;
        this.stressFirst = true;
        this.subdivision = [];

        // state properties
        this.currentBeat = 0;
        this.currentNote = 0;
        this.intervalHandle = null;
    }

    /**
     * When the beat changes, call the listener with the new beat in the measure.
     * This will be called for every step, if one beat consists of multiple notes,
     * the listener will be called multiple times for the same beat.
     * @param {function} listener Listener function.
     */
    addBeatChangeListener(listener) {
        this.beatChangeListeners.push(listener);
    }

    isPlaying() {
        return this.intervalHandle !== null;
    }

    /**
     * Play the metronome with the given configuration.
     * If the metronome can continue with the same delay, it will not restart
     * from the first beat.
     * @param {object} config Player configuration.
     * @example
     * {
     *   "bpm": 120,
     *   "beats": 4,
     *   "stressFirst": true,
     *   "subdivision": [1, 0, 1, 1]
     *   "waveform": "sine"
     * }
     */
    play(config) {
        if (this.intervalHandle !== null) {
            clearInterval(this.intervalHandle);
        }

        this.beats = config.beats;
        this.stressFirst = config.stressFirst;
        this.subdivision = config.subdivision;
        this.speaker.setWaveform(config.waveform);
        const delay = 60000.0 / (config.bpm * config.subdivision.length);

        this.currentBeat = 0;
        this.currentNote = 0;
        this.step();
        this.intervalHandle = setInterval(() => this.step(), delay);
    }

    /**
     * Check if the current beat is the first beat in the measure
     * and the first note in the subdivision.
     */
    isFirstBeat() {
        return (this.currentBeat === 0) && (this.currentNote === 0);
    }

    /**
     * Check if the current note is the first note in the subdivision.
     */
    isFirstNote() {
        return this.currentNote === 0;
    }

    /**
     * Move to the next note in the subdivision.
     */
    step() {
        this.notifyAll();

        if (this.subdivision[this.currentNote] === 1) {
            if (this.isFirstBeat()) {
                this.speaker.play(this.stressFirst ? TICK_FREQ : TOK_FREQ);
            } else {
                this.speaker.play(this.isFirstNote() ? TOK_FREQ : TAK_FREQ);
            }
        }

        if (++this.currentNote >= this.subdivision.length) {
            this.currentNote = 0;
            if (++this.currentBeat >= this.beats) {
                this.currentBeat = 0;
            }
        }
    }

    notifyAll() {
        this.beatChangeListeners.forEach(listener => listener(this.currentBeat));
    }

    /**
     * Stop the metronome.
     */
    stop() {
        if (this.intervalHandle === null) {
            return;
        }
        clearInterval(this.intervalHandle);
        this.intervalHandle = null;
    }
};

export { Player };
