import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Without this, a local `dist/` from `npm run build` gets picked up
    // alongside src/, double-running every *.test.ts as compiled *.test.js.
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
