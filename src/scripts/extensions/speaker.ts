// workaround for WebKit browsers that do not support AudioContext.
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export class Speaker {
    private audioCtx: AudioContext | null = null;
    private volume: GainNode | null = null;
    private waveform: Waveform;

    constructor() {
        this.waveform = 'square'; // default waveform
    }

    setWaveform(waveform: Waveform): void {
        this.waveform = waveform;
    }

    play(frequency: number): void {
        this.ensureAudioContext();

        // On iOS, the AudioContext will most likely to be interrupted
        // when the App goes to background.
        this.resumeAudioContext();

        const audioCtx = this.audioCtx!;
        const volume = this.volume!;

        let oscillator = audioCtx.createOscillator();
        oscillator.connect(volume);

        oscillator.type = this.waveform;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.04);
    }

    private createAudioContext(): void {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.volume = this.audioCtx.createGain();
        this.volume.connect(this.audioCtx.destination);
    }

    private ensureAudioContext(): void {
        if (this.audioCtx === null || this.volume === null) {
            this.createAudioContext();
        }
    }

    private resumeAudioContext(): void {
        if (this.audioCtx === null) {
            this.createAudioContext();
            return;
        }

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
