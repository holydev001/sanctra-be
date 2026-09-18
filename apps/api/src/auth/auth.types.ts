import type { Request } from 'express';

export interface PublicUser {
  id: string;
  githubUserId: string;
  login: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface AuthenticatedSession {
  sessionId: string;
  user: PublicUser;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedSession;
}
