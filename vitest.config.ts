import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
    },
    resolve: {
        alias: [{ find: '~', replacement: path.resolve(import.meta.dirname, 'src', 'scripts') }],
    },
});
