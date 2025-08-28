import bus from '~/extensions/event';
import { Module } from '~/extensions/module';

class DotModule extends Module {
    private dotList: HTMLUListElement = undefined!;
    private beats: number = 0;
    private currentBeat: number = 0;

    mount(): void {
        this.dotList = document.getElementById('dot-list') as HTMLUListElement;

        bus.on('beats-changed', this.onBeatsChanged.bind(this));
        bus.on('play', this.onPlay.bind(this));
        bus.on('stop', this.onStop.bind(this));
        bus.on('beat', this.onBeat.bind(this));
    }

    private onBeatsChanged(beats: number): void {
        this.beats = beats;
        this.currentBeat = 0;

        this.initializeDots();
    }

    private onPlay(): void {
        this.currentBeat = -1;
    }

    private onStop(): void {
        this.dotList.children[this.currentBeat].classList.remove('active');
    }

    private onBeat(): void {
        this.step();
    }

    private initializeDots(): void {
        this.dotList.innerHTML = '';
        for (let i = 0; i < this.beats; i++) {
            const dot = document.createElement('li');
            dot.classList.add('dot', 'grey-green-grad');
            this.dotList.appendChild(dot);
        }
    }

    private step(): void {
        if (this.currentBeat != -1) {
            this.dotList.children[this.currentBeat].classList.remove('active');
        }
        this.currentBeat = (this.currentBeat + 1) % this.beats;
        this.dotList.children[this.currentBeat].classList.add('active');
    }
}

export default DotModule;
