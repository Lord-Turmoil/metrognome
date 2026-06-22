import Storage from '~/extensions/storage';
import { Module } from '~/extensions/module';
import bus, { ChangeBpmEvent } from '~/extensions/event';

const MIN_BPM = 1;
const MAX_BPM = 320;
const DEFAULT_BPM = 60;
const HOLD_THRESHOLD = 400;
const HOLD_BASELINE = 800;

interface HoldStatus {
    action: string;
    elapsed: number;
    lastTimestamp: number;
}

class BpmModule extends Module {
    private bpm: number = DEFAULT_BPM;
    private input: HTMLInputElement = undefined!;
    private holdStatus: HoldStatus = {
        action: '',
        elapsed: 0,
        lastTimestamp: 0,
    };

    mount(): void {
        this.bpm = Storage.loadInt('bpm', DEFAULT_BPM);

        this.input = document.getElementById('bpm') as HTMLInputElement;
        this.input.value = this.bpm.toString();

        bus.on('change-bpm', this.onChangeBpm.bind(this));
        bus.on('update-bpm', this.onUpdateBpm.bind(this));

        bus.emit('bpm-changed', this.bpm);

        this.input.setAttribute('placeholder', `${MIN_BPM} ~ ${MAX_BPM}`);
    }

    private computeAmplifyFactor(action: string, timestamp: number): number {
        if (action != 'increase' && action != 'decrease') {
            return 1.0;
        }

        if (this.holdStatus.action != action) {
            this.holdStatus.action = action;
            this.holdStatus.lastTimestamp = timestamp;
            this.holdStatus.elapsed = 0;
            return 1.0;
        }

        if (timestamp - this.holdStatus.lastTimestamp > HOLD_THRESHOLD) {
            this.holdStatus.lastTimestamp = timestamp;
            this.holdStatus.elapsed = 0;
            return 1.0;
        }

        this.holdStatus.elapsed += timestamp - this.holdStatus.lastTimestamp;
        this.holdStatus.lastTimestamp = timestamp;

        return Math.min(Math.max(1.0, Math.pow(this.holdStatus.elapsed / HOLD_BASELINE, 1.5)), 100);
    }

    private onChangeBpm(event: ChangeBpmEvent): void {
        let bpm = this.bpm;
        const currentTimestamp = Date.now();
        const factor = this.computeAmplifyFactor(event.action, currentTimestamp);

        console.log(factor);

        if (event.action === 'increase') {
            bpm = Math.ceil(bpm + event.value * factor);
        } else if (event.action === 'decrease') {
            bpm = Math.floor(bpm - event.value * factor);
        } else if (event.action === 'set') {
            bpm = parseInt(this.input.value, 10);
            if (isNaN(bpm)) {
                bpm = this.bpm;
            }
        }

        if (bpm < MIN_BPM) {
            bpm = MIN_BPM;
        } else if (bpm > MAX_BPM) {
            bpm = MAX_BPM;
        }

        if (this.bpm === bpm) {
            return; // No change
        }

        this.bpm = bpm;
        this.input.value = bpm.toString();

        Storage.save('bpm', this.bpm);

        bus.emit('bpm-changed', this.bpm);
    }

    private onUpdateBpm(bpm: number): void {
        if (bpm < MIN_BPM) {
            bpm = MIN_BPM;
        } else if (bpm > MAX_BPM) {
            bpm = MAX_BPM;
        }

        this.bpm = bpm;
        this.input.value = this.bpm.toString();

        Storage.save('bpm', this.bpm);

        bus.emit('bpm-changed', this.bpm);
    }
}

export default BpmModule;
