import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true, // Enable Jest-like global APIs (describe, test, expect)
    },
});
