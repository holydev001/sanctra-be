import { Controller, Get, Inject, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { OAUTH_STATE_COOKIE, SESSION_COOKIE } from './auth.constants';
import { SessionGuard } from './session.guard';
import type { AuthenticatedRequest } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get('github')
  async startGitHubOAuth(@Res() response: Response): Promise<void> {
    const authorizationUrl = await this.authService.createGitHubAuthorizationUrl(response);
    response.redirect(authorizationUrl);
  }

  @Get('github/callback')
  async completeGitHubOAuth(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    if (error) {
      response.redirect(this.authService.getFrontendRedirect('error', 'oauth_denied'));
      return;
    }

    if (!code || !state) {
      response.redirect(this.authService.getFrontendRedirect('error', 'missing_oauth_parameters'));
      return;
    }

    try {
      await this.authService.completeGitHubAuthorization(
        code,
        state,
        request.cookies?.[OAUTH_STATE_COOKIE],
        response,
      );
      response.redirect(this.authService.getFrontendRedirect('success'));
    } catch {
      response.redirect(this.authService.getFrontendRedirect('error', 'oauth_failed'));
    }
  }

  @Get('me')
  @UseGuards(SessionGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest): {
    user: NonNullable<AuthenticatedRequest['auth']>['user'];
  } {
    return { user: request.auth!.user };
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    await this.authService.revokeSession(request.auth!.sessionId);
    response.clearCookie(SESSION_COOKIE, this.authService.getSessionCookieOptions());
    return { ok: true };
  }
}
