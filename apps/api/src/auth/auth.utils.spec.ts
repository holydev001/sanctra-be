import { describe, expect, it } from 'vitest';
import {
  buildGitHubAuthorizationUrl,
  createOpaqueToken,
  hashState,
  hashToken,
  safelyEqual,
} from './auth.utils';

describe('auth utilities', () => {
  it('builds a GitHub OAuth authorization URL with the required state', () => {
    const url = new URL(
      buildGitHubAuthorizationUrl(
        'client-id',
        'http://localhost:3000/v1/auth/github/callback',
        'oauth-state',
      ),
    );

    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/v1/auth/github/callback',
    );
    expect(url.searchParams.get('scope')).toBe('read:user user:email');
    expect(url.searchParams.get('state')).toBe('oauth-state');
  });

  it('creates high-entropy opaque tokens and deterministic secret-bound hashes', () => {
    const firstToken = createOpaqueToken();
    const secondToken = createOpaqueToken();

    expect(firstToken).not.toBe(secondToken);
    expect(hashToken(firstToken, 'session-secret')).toBe(hashToken(firstToken, 'session-secret'));
    expect(hashToken(firstToken, 'session-secret')).not.toBe(
      hashToken(firstToken, 'different-secret'),
    );
  });

  it('compares OAuth state without leaking an early comparison result', () => {
    expect(safelyEqual('same-state', 'same-state')).toBe(true);
    expect(safelyEqual('same-state', 'different-state')).toBe(false);
    expect(safelyEqual('same-state', 'same')).toBe(false);
    expect(hashState('same-state')).toHaveLength(64);
  });
});
