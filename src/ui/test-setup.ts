import { afterEach } from 'vitest';

// Testing Library mounts into the shared jsdom document; unmount after every DOM test. Node-only test files
// have no document and skip this.
afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
