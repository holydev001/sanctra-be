# ADR 001 Backend Architecture

## Status

Accepted

## Decision

Sanctra uses a pnpm TypeScript monorepo with a NestJS API, a separate BullMQ worker process, PostgreSQL through Prisma, Redis, and package boundaries for GitHub integration, detection, generation, validation, templates, and shared contracts.

## Rationale

The API must remain responsive and must not execute untrusted repository code. Background jobs provide retries, progress, concurrency controls, and isolation boundaries while the package structure allows detectors, templates, and validators to evolve independently.
