import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { AppEnv } from '@sanctra/config';
import { AuthService } from './auth.service';
import { SESSION_COOKIE } from './auth.constants';
import type { PrismaService } from '../database/prisma.service';
import type { RedisService } from '../redis/redis.service';

function createConfig() {
  const values = {
    GITHUB_OAUTH_CLIENT_ID: 'client-id',
    GITHUB_OAUTH_REDIRECT_URI: 'http://localhost:3000/v1/auth/github/callback',
    NODE_ENV: 'test',
    SESSION_SECRET: 'x'.repeat(32),
    SESSION_TTL_SECONDS: 3600,
    WEB_APP_URL: 'http://localhost:5173',
  };

  return {
    get: vi.fn((key: keyof typeof values) => values[key]),
    getOrThrow: vi.fn((key: keyof typeof values) => values[key]),
  } as unknown as ConfigService<AppEnv>;
}

describe('AuthService', () => {
  it('stores OAuth state and sets a short-lived state cookie', async () => {
    const config = createConfig();
    const redis = { setWithExpiry: vi.fn() } as unknown as RedisService;
    const prisma = {} as PrismaService;
    const response = { cookie: vi.fn() } as unknown as Response;
    const service = new AuthService(config, prisma, redis);

    const url = await service.createGitHubAuthorizationUrl(response);

    expect(new URL(url).searchParams.get('client_id')).toBe('client-id');
    expect(redis.setWithExpiry).toHaveBeenCalledWith(
      expect.stringMatching(/^sanctra:oauth:state:[a-f0-9]{64}$/),
      '1',
      600,
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'sanctra_oauth_state',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, maxAge: 600_000, sameSite: 'lax' }),
    );
  });

  it('returns a public user for a valid active session', async () => {
    const config = createConfig();
    const prisma = {
      session: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'session-id',
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null,
          user: {
            id: 'user-id',
            githubUserId: '123',
            login: 'holydev001',
            email: 'david@example.com',
            avatarUrl: 'https://avatars.githubusercontent.com/u/123',
          },
        }),
      },
    } as unknown as PrismaService;
    const redis = {} as RedisService;
    const service = new AuthService(config, prisma, redis);

    await expect(service.validateSession('session-token')).resolves.toEqual({
      sessionId: 'session-id',
      user: {
        id: 'user-id',
        githubUserId: '123',
        login: 'holydev001',
        email: 'david@example.com',
        avatarUrl: 'https://avatars.githubusercontent.com/u/123',
      },
    });
  });

  it('builds the success redirect without exposing session data', () => {
    const service = new AuthService(createConfig(), {} as PrismaService, {} as RedisService);

    expect(service.getFrontendRedirect('success')).toBe('http://localhost:5173/auth/callback');
    expect(service.getSessionCookieOptions()).toEqual(
      expect.objectContaining({ httpOnly: true, maxAge: 3_600_000 }),
    );
    expect(SESSION_COOKIE).toBe('sanctra_session');
  });
});
