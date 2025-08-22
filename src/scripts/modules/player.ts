import bus, { PlayEvent } from '../extensions/event';
import { Module } from '../extensions/module';
import { Speaker, Waveform } from '../extensions/speaker';

const TICK_FREQ = 1600;
const TOK_FREQ = 800;
const TAK_FREQ = 600;

/**
 * {
 *   "bpm": 120,
 *   "beats": 4,
 *   "stressFirst": true,
 *   "subdivision": [1, 0, 1, 1]
 *   "waveform": "sine"
 * }
 */
class Player extends Module {
    private speaker: Speaker;

    private bpm: number = 60;
    private beats: number = 4;
    private stressFirst: boolean = true;
    private subdivision: number[] = [1];

    private intervalHandle: number = -1;
    private currentBeat: number = 0;
    private currentNote: number = 0;

    private playButton: HTMLButtonElement = undefined!;
    private playText: HTMLSpanElement = undefined!;
    private stopText: HTMLSpanElement = undefined!;

    constructor(speaker: Speaker) {
        super();
        this.speaker = speaker;
    }

    mount(): void {
        this.playButton = document.getElementById('play') as HTMLButtonElement;
        this.playText = document.getElementById('play-play') as HTMLSpanElement;
        this.stopText = document.getElementById('play-stop') as HTMLSpanElement;

        bus.on('bpm-changed', this.onBpmChanged.bind(this));
        bus.on('beats-changed', this.onBeatsChanged.bind(this));
        bus.on('stress-changed', this.onStressChanged.bind(this));
        bus.on('subdivision-changed', this.onSubdivisionChanged.bind(this));
        bus.on('waveform-changed', this.onWaveformChanged.bind(this));

        bus.on('toggle-play', this.onTogglePlay.bind(this));
        bus.on('switch', this.onSwitch.bind(this));

        this.updateDisplay();
    }

    private onBpmChanged(bpm: number): void {
        this.bpm = bpm;
        if (this.isPlaying()) {
            bus.emit('toggle-play', { replay: true });
        }
    }

    private onBeatsChanged(beats: number): void {
        this.beats = beats;
        if (this.isPlaying()) {
            bus.emit('toggle-play', { replay: true });
        }
    }

    private onStressChanged(stress: boolean): void {
        this.stressFirst = stress;
    }

    private onSubdivisionChanged(subdivision: number[]): void {
        this.subdivision = subdivision;
        if (this.isPlaying()) {
            bus.emit('toggle-play', { replay: true });
        }
    }

    private onWaveformChanged(waveform: Waveform): void {
        this.speaker.setWaveform(waveform);
    }

    private onTogglePlay(event: PlayEvent): void {
        if (event.replay) {
            if (this.isPlaying()) {
                this.stop();
                this.play();
                this.updateDisplay();
            }
        } else {
            if (this.isPlaying()) {
                this.stop();
            } else {
                this.play();
            }
            this.updateDisplay();
        }
    }

    private onSwitch(): void {
        if (this.isPlaying()) {
            this.stop();
            this.updateDisplay();
        }
    }

    private play(): void {
        // play event should be emitted before beat event
        bus.emit('play');

        const delay = 60000.0 / (this.bpm * this.subdivision.length);
        this.currentBeat = 0;
        this.currentNote = 0;

        this.step();
        this.intervalHandle = setInterval(() => this.step(), delay);
    }

    private isPlaying(): boolean {
        return this.intervalHandle !== -1;
    }

    private step(): void {
        if (this.subdivision[this.currentNote] === 1) {
            if (this.isFirstBeat()) {
                this.speaker.play(this.stressFirst ? TICK_FREQ : TOK_FREQ);
            } else {
                this.speaker.play(this.isFirstNote() ? TOK_FREQ : TAK_FREQ);
            }
        }

        if (this.isFirstNote()) {
            bus.emit('beat');
        }

        if (++this.currentNote >= this.subdivision.length) {
            this.currentNote = 0;
            if (++this.currentBeat >= this.beats) {
                this.currentBeat = 0;
            }
        }
    }

    private isFirstBeat(): boolean {
        return this.currentBeat === 0 && this.currentNote === 0;
    }

    private isFirstNote(): boolean {
        return this.currentNote === 0;
    }

    private stop(): void {
        if (this.intervalHandle !== -1) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = -1;
            bus.emit('stop');
        }
    }

    private updateDisplay(): void {
        if (this.isPlaying()) {
            this.playButton.classList.remove('stopped');
            this.playButton.classList.add('playing');
            this.playText.style.display = 'none';
            this.stopText.style.display = 'block';
        } else {
            this.playButton.classList.remove('playing');
            this.playButton.classList.add('stopped');
            this.playText.style.display = 'block';
            this.stopText.style.display = 'none';
        }
    }
}

export default Player;
