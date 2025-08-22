import bus, { Mode } from './extensions/event';
import { App } from './extensions/module';

class Metrognome extends App {
    private mode: Mode = 'play';

    constructor() {
        super();

        this.addEventListener('language', 'click', () => {
            bus.emit('change-language');
        });

        this.addEventListener('bpm-decrease-5', 'click', () => {
            bus.emit('change-bpm', { action: 'decrease', value: 5 });
        });
        this.addEventListener('bpm-decrease-1', 'click', () => {
            bus.emit('change-bpm', { action: 'decrease', value: 1 });
        });
        this.addEventListener('bpm-increase-1', 'click', () => {
            bus.emit('change-bpm', { action: 'increase', value: 1 });
        });
        this.addEventListener('bpm-increase-5', 'click', () => {
            bus.emit('change-bpm', { action: 'increase', value: 5 });
        });
        this.addEventListener('bpm', 'change', () => {
            bus.emit('change-bpm', { action: 'set', value: 0 });
        });

        this.addEventListener('beats-decrease-1', 'click', () => {
            bus.emit('change-beats', { action: 'decrease', value: 1 });
        });
        this.addEventListener('beats-increase-1', 'click', () => {
            bus.emit('change-beats', { action: 'increase', value: 1 });
        });
        this.addEventListener('beats', 'change', () => {
            bus.emit('change-beats', { action: 'set', value: 0 });
        });

        this.addEventListener('stress', 'click', () => {
            bus.emit('toggle-stress');
        });

        document.querySelectorAll<HTMLDivElement>('#sub-list .item').forEach((element, index) => {
            element.addEventListener('click', () => {
                bus.emit('change-subdivision', index);
            });
        });

        document.querySelectorAll<HTMLDivElement>('#wave-list .item').forEach((element, index) => {
            element.addEventListener('click', () => {
                bus.emit('change-waveform', index);
            });
        });

        this.addEventListener('play', 'click', () => {
            bus.emit('toggle-play', { replay: false });
        });

        this.addEventListener('tap', 'click', () => {
            bus.emit('tap');
        });

        this.addEventListener('switch', 'click', () => {
            this.toggleMode();
        });
    }

    private addEventListener(id: string, event: string, callback: () => void): void {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id "${id}" not found.`);
            return;
        }
        element.addEventListener(event, callback);
    }

    private toggleMode(): void {
        if (this.mode === 'play') {
            document.getElementById('play')!.style.display = 'none';
            document.getElementById('tap')!.style.display = 'block';
            this.mode = 'tap';
        } /* (this.mode === 'tap') */ else {
            document.getElementById('play')!.style.display = 'block';
            document.getElementById('tap')!.style.display = 'none';
            this.mode = 'play';
        }
        bus.emit('switch', this.mode);
    }
}

export default Metrognome;
