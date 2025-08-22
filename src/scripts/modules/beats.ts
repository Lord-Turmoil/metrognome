import bus, { ChangeBeatsEvent } from '../extensions/event';
import { Module } from '../extensions/module';
import Storage from '../extensions/storage';

const MIN_BEATS = 1;
const MAX_BEATS = 8;
const DEFAULT_BEATS = 4;
const DEFAULT_STRESS_FIRST = true;

class BeatsModule extends Module {
    private beats: number = DEFAULT_BEATS;
    private beatsInput: HTMLInputElement = undefined!;

    private stressFirst: boolean = DEFAULT_STRESS_FIRST;
    private stressButton: HTMLButtonElement = undefined!;
    private yesText: HTMLSpanElement = undefined!;
    private noText: HTMLSpanElement = undefined!;

    mount(): void {
        this.beats = Storage.loadInt('beats', DEFAULT_BEATS);
        if (this.beats < MIN_BEATS || this.beats > MAX_BEATS) {
            this.beats = DEFAULT_BEATS; // Reset to default if out of bounds
        }
        this.stressFirst = Storage.loadBool('stressFirst', DEFAULT_STRESS_FIRST);

        this.beatsInput = document.getElementById('beats') as HTMLInputElement;
        this.beatsInput.value = this.beats.toString();
        this.stressButton = document.getElementById('stress') as HTMLButtonElement;

        this.yesText = document.getElementById('stress-yes') as HTMLSpanElement;
        this.noText = document.getElementById('stress-no') as HTMLSpanElement;
        this.updateStressDisplay();

        bus.on('change-beats', this.onChangeBeats.bind(this));
        bus.on('toggle-stress', this.onToggleStress.bind(this));

        bus.emit('beats-changed', this.beats);
        bus.emit('stress-changed', this.stressFirst);
    }

    private updateStressDisplay(): void {
        if (this.stressFirst) {
            this.stressButton.classList.remove('no');
            this.stressButton.classList.add('yes');
            this.yesText.style.display = 'block';
            this.noText.style.display = 'none';
        } else {
            this.stressButton.classList.remove('yes');
            this.stressButton.classList.add('no');
            this.yesText.style.display = 'none';
            this.noText.style.display = 'block';
        }
    }

    private onChangeBeats(event: ChangeBeatsEvent): void {
        let beats = this.beats;
        if (event.action === 'increase') {
            beats += event.value;
        } else if (event.action === 'decrease') {
            beats -= event.value;
        } else if (event.action === 'set') {
            beats = parseInt(this.beatsInput.value, 10);
            if (isNaN(beats)) {
                beats = this.beats;
            }
        }

        if (beats < MIN_BEATS) {
            beats = MIN_BEATS;
        } else if (beats > MAX_BEATS) {
            beats = MAX_BEATS;
        }

        if (this.beats === beats) {
            return; // No change
        }

        this.beats = beats;
        this.beatsInput.value = this.beats.toString();

        Storage.save('beats', this.beats);

        bus.emit('beats-changed', this.beats);
    }

    private onToggleStress(): void {
        this.stressFirst = !this.stressFirst;

        Storage.save('stressFirst', this.stressFirst);

        bus.emit('stress-changed', this.stressFirst);

        this.updateStressDisplay();
    }
}

export default BeatsModule;
