import { Module } from '~/extensions/module';
import bus, { Mode } from '~/extensions/event';
import { Speaker } from '~/extensions/speaker';

// standard la frequency
const TAP_FREQ = 2000;

class TapModule extends Module {
    private speaker: Speaker;
    private currentBpm: number = 0;
    private isFirstTap: boolean = true;
    private lastTapTimestamp: number = 0;

    constructor(speaker: Speaker) {
        super();
        this.speaker = speaker;
    }

    mount() {
        bus.on('bpm-changed', this.onBpmChanged.bind(this));
        bus.on('switch', this.onSwitch.bind(this));
        bus.on('tap', this.onTap.bind(this));
    }

    private onBpmChanged(bpm: number): void {
        this.currentBpm = bpm;
    }

    private onSwitch(mode: Mode): void {
        if (mode !== 'tap') {
            return;
        }
        this.isFirstTap = true;
    }

    private onTap(): void {
        this.speaker.play(TAP_FREQ);

        if (this.isFirstTap) {
            this.isFirstTap = false;
            this.lastTapTimestamp = Date.now();
            return;
        }

        const currentTimestamp = Date.now();
        const interval = currentTimestamp - this.lastTapTimestamp;
        this.lastTapTimestamp = currentTimestamp;

        // ease the transition to the new BPM
        const bpm = Math.round(60000 / interval);
        this.currentBpm = Math.ceil(this.currentBpm * 0.5 + bpm * 0.5);

        bus.emit('update-bpm', this.currentBpm);
    }
}

export default TapModule;
