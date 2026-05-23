import bus, { BeatEvent } from '~/extensions/event';
import { Module } from '~/extensions/module';

class DotModule extends Module {
    private dotList: HTMLUListElement = undefined!;
    private beats: number = 0;
    private currentBeat: number = -1;

    mount(): void {
        this.dotList = document.getElementById('dot-list') as HTMLUListElement;

        bus.on('beats-changed', this.onBeatsChanged.bind(this));
        bus.on('play', this.onPlay.bind(this));
        bus.on('stop', this.onStop.bind(this));
        bus.on('beat', this.onBeat.bind(this));
    }

    private onBeatsChanged(beats: number): void {
        this.beats = beats;
        this.currentBeat = -1;

        this.initializeDots();
    }

    private onPlay(): void {
        this.clearActive();
        this.currentBeat = -1;
    }

    private onStop(): void {
        this.clearActive();
    }

    private onBeat(event: BeatEvent): void {
        this.clearActive();
        this.currentBeat = event.beatIndex;
        const dot = this.dotList.children[this.currentBeat];
        if (dot) {
            dot.classList.add('active');
        }
    }

    private clearActive(): void {
        if (this.currentBeat < 0) {
            return;
        }
        const dot = this.dotList.children[this.currentBeat];
        if (dot) {
            dot.classList.remove('active');
        }
    }

    private initializeDots(): void {
        this.dotList.innerHTML = '';
        for (let i = 0; i < this.beats; i++) {
            const dot = document.createElement('li');
            dot.classList.add('dot', 'grey-green-grad');
            this.dotList.appendChild(dot);
        }
    }
}

export default DotModule;
