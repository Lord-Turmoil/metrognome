import { defineConfig } from 'vite';
import htmlMinifier from 'vite-plugin-html-minifier';

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
});
