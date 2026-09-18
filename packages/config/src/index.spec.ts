import { describe, expect, it } from 'vitest';
import { parseEnv } from './index';

describe('parseEnv', () => {
  it('provides local development defaults', () => {
    expect(parseEnv({}).REDIS_URL).toBe('redis://localhost:6379');
  });
});
