import mitt from 'mitt';

import { Waveform } from '~/extensions/speaker';

type Events = {
    'toggle-language': void;
    'update-language': void;

    'change-bpm': ChangeBpmEvent;
    'bpm-changed': number;
    'update-bpm': number; // tap update

    'change-beats': ChangeBeatsEvent;
    'beats-changed': number;
    'toggle-stress': void;
    'stress-changed': boolean;

    'change-subdivision': number;
    'toggle-subdivision': void;
    'subdivision-changed': number[];

    'change-waveform': number;
    'toggle-waveform': void;
    'waveform-changed': Waveform;

    'toggle-play': PlayEvent;

    'toggle-mode': void;
    'change-mode': Mode;

    'toggle-focus': void;

    play: void;
    stop: void;
    beat: BeatEvent;
    tap: void;
};

export type ChangeBpmEvent = {
    action: 'increase' | 'decrease' | 'set';
    value: number;
};

export type ChangeBeatsEvent = {
    action: 'increase' | 'decrease' | 'set';
    value: number; // 'set' will ignore value
};

export type PlayEvent = {
    replay: boolean;
};

export type BeatEvent = {
    beatIndex: number;
};

export type Mode = 'play' | 'tap';

const bus = mitt<Events>();

export default bus;
