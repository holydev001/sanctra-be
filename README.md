# Sanctra Backend

Sanctra is a GitHub-connected DevOps automation platform. This repository contains the backend monorepo for authentication, GitHub App integration, repository analysis, infrastructure generation, validation, and pull-request creation.

## Stack

- NestJS and TypeScript for the API
- PostgreSQL and Prisma for relational data
- Redis and BullMQ for asynchronous jobs
- Octokit and a GitHub App for repository operations
- S3-compatible object storage for temporary reports and artifacts
- Docker Compose for local PostgreSQL, Redis, and MinIO
- pnpm workspaces for the monorepo

## Repository workflow

`dev` is the development base branch. Work must happen on a feature branch and merge into `dev` through a pull request. `main` is reserved for stable releases and is also pull-request only.

```text
feature/* → PR → dev → PR/release → main
```

Direct commits, direct merges, force pushes, and branch deletion are disabled on `dev` and `main` once the remote repository is available.

## Local setup

Requirements:

- Node.js 22 or newer
- pnpm 11.19.0 or newer
- Docker and Docker Compose

```bash
pnpm install
cp .env.example .env
pnpm infra:up
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev:api
```

The API will be available at `http://localhost:3000`. The health endpoint is `GET /health` and the versioned API base is `/v1`.

## GitHub sign-in configuration

Create a GitHub OAuth App and set its callback URL to:

```text
http://localhost:3000/v1/auth/github/callback
```

Copy the client ID and secret into `GITHUB_OAUTH_CLIENT_ID` and
`GITHUB_OAUTH_CLIENT_SECRET`. Set `WEB_APP_URL` to the frontend origin. The API
uses Redis for one-time OAuth state values and PostgreSQL for opaque sessions.

Authentication endpoints:

```text
GET  /v1/auth/github
GET  /v1/auth/github/callback
GET  /v1/auth/me
POST /v1/auth/logout
```

The GitHub OAuth flow requests only `read:user user:email`. Repository access is
handled separately by the Sanctra GitHub App installation flow.

Run the worker in a second terminal:

```bash
pnpm dev:worker
```

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Workspace structure

```text
apps/api                  NestJS HTTP API
apps/worker               BullMQ background worker
packages/database         Prisma schema and client generation
packages/shared           Shared domain types and constants
packages/config           Environment parsing and configuration
packages/github           Octokit integration boundary
packages/detectors        Repository detection framework
packages/generators       Infrastructure generation boundary
packages/validators       Generated-file validation boundary
packages/templates        Versioned template boundary
infra/docker              Local infrastructure services
docs/adr                  Architecture decision records
```

## First vertical slice

The first backend slice is intentionally narrow:

```text
GitHub sign-in → repository selection → package-manager detection → persisted report
```

See `AGENTS.md` for implementation boundaries and contribution rules.
