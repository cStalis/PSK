import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'test-game-id' },
});
