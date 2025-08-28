import Storage from '~/extensions/storage';
import { Module } from '~/extensions/module';
import bus, { ChangeBpmEvent } from '~/extensions/event';

const MIN_BPM = 1;
const MAX_BPM = 320;
const DEFAULT_BPM = 60;

class BpmModule extends Module {
    private bpm: number = DEFAULT_BPM;
    private input: HTMLInputElement = undefined!;

    mount(): void {
        this.bpm = Storage.loadInt('bpm', DEFAULT_BPM);

        this.input = document.getElementById('bpm') as HTMLInputElement;
        this.input.value = this.bpm.toString();

        bus.on('change-bpm', this.onChangeBpm.bind(this));
        bus.on('update-bpm', this.onUpdateBpm.bind(this));

        bus.emit('bpm-changed', this.bpm);
    }

    private onChangeBpm(event: ChangeBpmEvent): void {
        let bpm = this.bpm;
        if (event.action === 'increase') {
            bpm += event.value;
        } else if (event.action === 'decrease') {
            bpm -= event.value;
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
