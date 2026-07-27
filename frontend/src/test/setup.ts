import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Unmount components between tests so effects/timers from one test don't leak into the next.
afterEach(() => {
  cleanup();
});
