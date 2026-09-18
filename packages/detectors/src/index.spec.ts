import { describe, expect, it } from 'vitest';
import { detectPackageManager } from './index';

describe('detectPackageManager', () => {
  it('detects pnpm from its lockfile', () => {
    expect(detectPackageManager(['package.json', 'pnpm-lock.yaml']).manager).toBe('pnpm');
  });

  it('returns unknown when there is no supported lockfile', () => {
    expect(detectPackageManager(['README.md']).manager).toBe('unknown');
  });
});
