import { App } from '~/extensions/module';
import bus, { Mode } from '~/extensions/event';

interface KeyAction {
    keys: string[];
    code: string;
    action: () => void;
}

function createAction(key: string | string[], code: string, action: () => void): KeyAction {
    if (key instanceof Array) {
        return { keys: key, code, action };
    } else {
        return { keys: [key], code: code, action: action };
    }
}

class Metrognome extends App {
    private mode: Mode = 'play';

    constructor() {
        super();

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

        this.addEventListener('mode', 'click', () => {
            bus.emit('toggle-mode');
        });

        this.addEventListener('focus', 'click', () => {
            bus.emit('toggle-focus');
        });

        this.addEventListener('language', 'click', () => {
            bus.emit('toggle-language');
        });

        const actions: KeyAction[] = [
            createAction(' ', 'Space', () => {
                if (this.mode === 'play') {
                    bus.emit('toggle-play', { replay: false });
                } else if (this.mode === 'tap') {
                    bus.emit('tap');
                }
            }),

            createAction('ArrowUp', 'ArrowUp', () => {
                bus.emit('change-bpm', { action: 'increase', value: 1 });
            }),
            createAction('ArrowDown', 'ArrowDown', () => {
                bus.emit('change-bpm', { action: 'decrease', value: 1 });
            }),
            createAction('ArrowRight', 'ArrowRight', () => {
                bus.emit('change-beats', { action: 'increase', value: 1 });
            }),
            createAction('ArrowLeft', 'ArrowLeft', () => {
                bus.emit('change-beats', { action: 'decrease', value: 1 });
            }),

            createAction(['w', 'W'], 'KeyW', () => {
                bus.emit('toggle-waveform');
            }),
            createAction(['s', 'S'], 'KeyS', () => {
                bus.emit('toggle-subdivision');
            }),
            createAction(['b', 'B'], 'KeyB', () => {
                bus.emit('toggle-stress');
            }),

            createAction(['f', 'F'], 'KeyF', () => {
                bus.emit('toggle-focus');
            }),
            createAction(['m', 'M'], 'KeyM', () => {
                bus.emit('toggle-mode');
            }),

            createAction(['t', 'T'], 'KeyT', () => {
                bus.emit('toggle-language');
            }),
        ];

        document.addEventListener('keydown', function (e) {
            for (let action of actions) {
                if (e.code === action.code || action.keys.includes(e.key)) {
                    action.action();
                    e.preventDefault();
                    break;
                }
            }
        });

        bus.on('toggle-mode', this.onToggleMode.bind(this));
    }

    private addEventListener(id: string, event: string, callback: () => void): void {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id "${id}" not found.`);
            return;
        }
        element.addEventListener(event, callback);
    }

    private onToggleMode(): void {
        if (this.mode === 'play') {
            document.getElementById('play')!.style.display = 'none';
            document.getElementById('tap')!.style.removeProperty('display');
            this.mode = 'tap';
        } /* (this.mode === 'tap') */ else {
            document.getElementById('play')!.style.removeProperty('display');
            document.getElementById('tap')!.style.display = 'none';
            this.mode = 'play';
        }
        bus.emit('change-mode', this.mode);
    }
}

export default Metrognome;
