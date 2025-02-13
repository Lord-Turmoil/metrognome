/**
 * @module speaker
 * This module handles the sound output.
 */

const DEFAULT_WAVEFORM = "square";

class Speaker {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.volume = this.audioCtx.createGain();
        this.volume.connect(this.audioCtx.destination);

        this.waveform = DEFAULT_WAVEFORM;
    }

    /**
     * Set the waveform type.
     * @param {string} waveform Waveform type.
     * @example Available waveform types: "sine", "square", "sawtooth", "triangle"
     */
    setWaveform(waveform) {
        this.waveform = waveform;
    }

    /**
     * Play the sound with the given frequency.
     * @param {number} frequency 
     */
    play(frequency) {
        let oscillator = this.audioCtx.createOscillator();
        oscillator.connect(this.volume);

        oscillator.type = this.waveform;
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 0.04);
    }
};

export { Speaker };
