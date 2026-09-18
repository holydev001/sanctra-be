import { describe, expect, it } from 'vitest';
import { parseEnv } from './index';

describe('parseEnv', () => {
  it('provides local development defaults', () => {
    expect(
      parseEnv({
        DATABASE_URL: 'postgresql://localhost:5432/sanctra?schema=public',
        REDIS_URL: 'redis://localhost:6379',
        S3_ACCESS_KEY_ID: 'local-access-key',
        S3_SECRET_ACCESS_KEY: 'local-secret-key',
        SESSION_SECRET: 'x'.repeat(32),
      }).REDIS_URL,
    ).toBe('redis://localhost:6379');
  });
});
