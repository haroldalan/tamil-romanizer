import { defineConfig } from 'vite';

export default defineConfig({
    // Base ensures assets are loaded via relative paths, crucial for GitHub pages
    base: './',
    build: {
        // Output the static site to the /docs folder in the root of tamil-romanizer
        outDir: '../docs',
        emptyOutDir: true
    }
});
