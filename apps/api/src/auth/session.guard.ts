import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { SESSION_COOKIE } from './auth.constants';
import type { AuthenticatedRequest } from './auth.types';
import { AuthService } from './auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionToken = request.cookies?.[SESSION_COOKIE];

    if (!sessionToken) {
      throw new UnauthorizedException('Authentication required');
    }

    const session = await this.authService.validateSession(sessionToken);

    if (!session) {
      throw new UnauthorizedException('Authentication required');
    }

    request.auth = session;
    return true;
  }
}
