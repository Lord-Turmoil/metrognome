import { registerPlugin } from '@capacitor/core';

import type { MetronomeBackgroundPlugin } from './definitions';

const MetronomeBackground = registerPlugin<MetronomeBackgroundPlugin>('MetronomeBackground');

export * from './definitions';
export { MetronomeBackground };
