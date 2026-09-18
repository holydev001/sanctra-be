import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { AppEnv } from '@sanctra/config';
import { fetchGitHubIdentity } from '@sanctra/github';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_SECONDS, SESSION_COOKIE } from './auth.constants';
import {
  buildGitHubAuthorizationUrl,
  createOpaqueToken,
  hashState,
  hashToken,
  safelyEqual,
} from './auth.utils';
import type { AuthenticatedSession, PublicUser } from './auth.types';

interface GitHubTokenResponse {
  access_token?: unknown;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<AppEnv>,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async createGitHubAuthorizationUrl(response: Response): Promise<string> {
    const clientId = this.config.get('GITHUB_OAUTH_CLIENT_ID');

    if (!clientId) {
      throw new InternalServerErrorException('GitHub OAuth is not configured');
    }

    const state = createOpaqueToken();
    await this.redis.setWithExpiry(this.getStateKey(state), '1', OAUTH_STATE_TTL_SECONDS);
    response.cookie(OAUTH_STATE_COOKIE, state, this.getCookieOptions(OAUTH_STATE_TTL_SECONDS));

    return buildGitHubAuthorizationUrl(
      clientId,
      this.config.getOrThrow('GITHUB_OAUTH_REDIRECT_URI'),
      state,
    );
  }

  async completeGitHubAuthorization(
    code: string,
    state: string,
    stateCookie: string | undefined,
    response: Response,
  ): Promise<PublicUser> {
    if (!stateCookie || !safelyEqual(state, stateCookie)) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const stateWasConsumed = await this.redis.consume(this.getStateKey(state));

    if (!stateWasConsumed) {
      throw new UnauthorizedException('Expired OAuth state');
    }

    const accessToken = await this.exchangeCodeForAccessToken(code);
    const identity = await fetchGitHubIdentity(accessToken);
    const user = await this.prisma.user.upsert({
      where: { githubUserId: identity.githubUserId },
      update: {
        login: identity.login,
        email: identity.email,
        avatarUrl: identity.avatarUrl,
      },
      create: {
        githubUserId: identity.githubUserId,
        login: identity.login,
        email: identity.email,
        avatarUrl: identity.avatarUrl,
      },
    });

    const sessionToken = createOpaqueToken();
    const ttlSeconds = this.config.getOrThrow('SESSION_TTL_SECONDS');
    await this.prisma.session.create({
      data: {
        tokenHash: hashToken(sessionToken, this.config.getOrThrow('SESSION_SECRET')),
        userId: user.id,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });

    response.clearCookie(OAUTH_STATE_COOKIE, this.getCookieOptions(0));
    response.cookie(SESSION_COOKIE, sessionToken, this.getCookieOptions(ttlSeconds));

    return this.toPublicUser(user);
  }

  async validateSession(sessionToken: string): Promise<AuthenticatedSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(sessionToken, this.config.getOrThrow('SESSION_SECRET')) },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return null;
    }

    return {
      sessionId: session.id,
      user: this.toPublicUser(session.user),
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  getFrontendRedirect(result: 'success' | 'error', errorCode?: string): string {
    const path = result === 'success' ? '/auth/callback' : '/auth/error';
    const url = new URL(path, this.config.getOrThrow('WEB_APP_URL'));

    if (result === 'error' && errorCode) {
      url.searchParams.set('code', errorCode);
    }

    return url.toString();
  }

  getSessionCookieOptions(): CookieOptions {
    return this.getCookieOptions(this.config.getOrThrow('SESSION_TTL_SECONDS'));
  }

  private async exchangeCodeForAccessToken(code: string): Promise<string> {
    const clientId = this.config.get('GITHUB_OAUTH_CLIENT_ID');
    const clientSecret = this.config.get('GITHUB_OAUTH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException('GitHub OAuth is not configured');
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: this.config.getOrThrow('GITHUB_OAUTH_REDIRECT_URI'),
      }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('GitHub OAuth token exchange failed');
    }

    const payload = (await response.json()) as GitHubTokenResponse;

    if (typeof payload.access_token !== 'string' || payload.access_token.length === 0) {
      throw new UnauthorizedException('GitHub OAuth token exchange failed');
    }

    return payload.access_token;
  }

  private getStateKey(state: string): string {
    return `sanctra:oauth:state:${hashState(state)}`;
  }

  private getCookieOptions(maxAgeSeconds: number): CookieOptions {
    return {
      httpOnly: true,
      maxAge: maxAgeSeconds * 1000,
      path: '/',
      sameSite: 'lax',
      secure: this.config.getOrThrow('NODE_ENV') === 'production',
    };
  }

  private toPublicUser(user: {
    id: string;
    githubUserId: string;
    login: string;
    email: string | null;
    avatarUrl: string | null;
  }): PublicUser {
    return {
      id: user.id,
      githubUserId: user.githubUserId,
      login: user.login,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }
}
