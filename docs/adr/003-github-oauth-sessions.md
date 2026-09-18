# ADR 003: GitHub OAuth and session boundary

## Status

Accepted

## Decision

Sanctra authenticates users with a GitHub OAuth App and maintains its own opaque,
database-backed session.

- `/v1/auth/github` creates a one-time OAuth state value, stores only its hash in
  Redis for ten minutes, and sets the state in an HTTP-only cookie.
- `/v1/auth/github/callback` requires both the callback state and matching state
  cookie, consumes the Redis state before exchanging the code, and requests only
  `read:user user:email`.
- GitHub OAuth access tokens are used to fetch the identity and are not persisted.
  Repository access belongs to the separate GitHub App installation flow.
- Sessions use a random opaque token. Only an HMAC-SHA-256 hash of the token is
  stored in PostgreSQL, while the raw token is sent in an HTTP-only cookie.
- `/v1/auth/me` validates the session and returns the public user shape. Logout
  revokes the session server-side.

## Rationale

This keeps the login credential boundary separate from repository permissions.
The OAuth state prevents login CSRF, Redis provides short-lived replay protection,
and database sessions allow explicit revocation without exposing a JWT to browser
JavaScript.
