import { defineConfig } from 'vite';
import htmlMinifier from 'vite-plugin-html-minifier';
import * as path from 'path';

export default defineConfig({
    root: '.',
    build: {
        outDir: './dist',
        minify: true,
        emptyOutDir: true,
    },
    plugins: [
        htmlMinifier({
            minify: true,
        }),
    ],
    resolve: {
        alias: [{ find: '~', replacement: path.resolve(__dirname, 'src', 'scripts') }]
    }
});
