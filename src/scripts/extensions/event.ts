import mitt from 'mitt';
import { Waveform } from './speaker';

type Events = {
    'change-language': void;
    'update-language': void;
    'change-mode': void;

    'change-bpm': ChangeBpmEvent;
    'bpm-changed': number;
    'update-bpm': number; // tap update

    'change-beats': ChangeBeatsEvent;
    'beats-changed': number;
    'toggle-stress': void;
    'stress-changed': boolean;

    'change-subdivision': number;
    'subdivision-changed': number[];

    'change-waveform': number;
    'waveform-changed': Waveform;

    'toggle-play': PlayEvent;
    play: void;
    stop: void;

    beat: void;

    switch: Mode;
    tap: void;
};

export type ChangeBpmEvent = {
    action: 'increase' | 'decrease' | 'set';
    value: number;
};

export type ChangeBeatsEvent = {
    action: 'increase' | 'decrease' | 'set';
    value: number;
};

export type PlayEvent = {
    replay: boolean;
};

export type Mode = 'play' | 'tap';

const bus = mitt<Events>();

export default bus;
