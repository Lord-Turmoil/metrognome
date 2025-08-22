import bus from '../extensions/event';
import { Module } from '../extensions/module';
import { Waveform } from '../extensions/speaker';
import Storage from '../extensions/storage';

const WAVEFORM: Waveform[] = ['square', 'sawtooth', 'sine', 'triangle'];

const DEFAULT_WAVEFORM = 0;
const MIN_WAVEFORM = 0;
const MAX_WAVEFORM = WAVEFORM.length - 1;

class SoundModule extends Module {
    private currentWaveform: number = DEFAULT_WAVEFORM;
    private waveformList: HTMLDivElement[] = [];

    mount(): void {
        this.currentWaveform = Storage.loadInt('waveform', DEFAULT_WAVEFORM);
        if (this.currentWaveform < MIN_WAVEFORM || this.currentWaveform > MAX_WAVEFORM) {
            this.currentWaveform = DEFAULT_WAVEFORM; // Reset to default if out of bounds
        }

        this.waveformList = [...document.querySelectorAll<HTMLDivElement>('#wave-list .item')];
        this.waveformList[this.currentWaveform].classList.add('active');

        bus.on('change-waveform', this.onChangeWaveform.bind(this));

        bus.emit('waveform-changed', WAVEFORM[this.currentWaveform]);
    }

    private onChangeWaveform(waveform: number): void {
        if (waveform < MIN_WAVEFORM || waveform > MAX_WAVEFORM) {
            waveform = DEFAULT_WAVEFORM; // Reset to default if out of bounds
        }
        if (this.currentWaveform === waveform) {
            return; // No change
        }

        this.waveformList[this.currentWaveform].classList.remove('active');
        this.currentWaveform = waveform;
        this.waveformList[this.currentWaveform].classList.add('active');

        Storage.save('waveform', this.currentWaveform);

        bus.emit('waveform-changed', WAVEFORM[this.currentWaveform]);
    }
}

export default SoundModule;
