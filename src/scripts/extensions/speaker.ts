// workaround for WebKit browsers that do not support AudioContext.
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export class Speaker {
    private readonly audioCtx: AudioContext;
    private readonly volume: GainNode;
    private waveform: Waveform;

    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.volume = this.audioCtx.createGain();
        this.volume.connect(this.audioCtx.destination);

        this.waveform = 'square'; // default waveform
    }

    setWaveform(waveform: Waveform): void {
        this.waveform = waveform;
    }

    play(frequency: number): void {
        let oscillator = this.audioCtx.createOscillator();
        oscillator.connect(this.volume);

        oscillator.type = this.waveform;
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 0.04);
    }
}
