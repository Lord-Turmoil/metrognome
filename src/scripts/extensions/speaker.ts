// workaround for WebKit browsers that do not support AudioContext.
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export class Speaker {
    private audioCtx: AudioContext;
    private volume: GainNode;
    private waveform: Waveform;

    constructor() {
        this.createAudioContext();
        this.waveform = 'square'; // default waveform
    }

    setWaveform(waveform: Waveform): void {
        this.waveform = waveform;
    }

    play(frequency: number): void {
        // On iOS, the AudioContext will most likely to be interrupted
        // when the App goes to background.
        this.resumeAudioContext();

        let oscillator = this.audioCtx.createOscillator();
        oscillator.connect(this.volume);

        oscillator.type = this.waveform;
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 0.04);
    }

    private createAudioContext(): void {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.volume = this.audioCtx.createGain();
        this.volume.connect(this.audioCtx.destination);
    }

    private resumeAudioContext(): void {
        if (this.audioCtx.state === 'running') {
            return;
        }

        if (this.audioCtx.state === 'interrupted') {
            console.log('Resuming interrupted AudioContext');
            this.createAudioContext();
        } else if (this.audioCtx.state === 'suspended') {
            console.log('Resuming suspended AudioContext');
            this.audioCtx.resume();
        } else if (this.audioCtx.state === 'closed') {
            console.log('Recreating closed AudioContext');
            this.createAudioContext();
        }
    }
}
