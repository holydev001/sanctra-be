# Sanctra Backend Agent Guide

## Mission

Build a safe, explainable, provider-agnostic backend that analyzes repositories and creates validated infrastructure changes through pull requests.

## Required architecture

- `apps/api`: NestJS HTTP API and request orchestration.
- `apps/worker`: BullMQ workers. Never execute repository code in the API process.
- `packages/database`: Prisma schema and database client boundary.
- `packages/shared`: Shared types, enums, and contracts.
- `packages/github`: Octokit and GitHub App boundary.
- `packages/detectors`: Deterministic repository detectors.
- `packages/generators`: Typed generation plans and renderers.
- `packages/validators`: YAML, JSON, Dockerfile, shell, workflow, and policy validation.
- `packages/templates`: Versioned deterministic templates.
- `packages/config`: Environment parsing and runtime configuration.

## Working rules

1. Create a feature branch from `dev`.
2. Keep changes scoped and update tests with behavior changes.
3. Run format, lint, typecheck, test, and build before opening a PR.
4. Open a PR targeting `dev`; never commit directly to `dev` or `main`.
5. Never force-push shared branches.
6. Do not add secrets, repository contents, or environment values to logs.
7. Do not execute untrusted repository code in the API process.
8. Every GitHub write must be explicit, idempotent, and audited.
9. Generated files must be deterministic and validated before a GitHub write.
10. Record material architectural decisions in `docs/adr`.

## Definition of done

- Unit and integration tests pass.
- API contracts and schemas are updated.
- Critical paths have structured logs and observability.
- Security implications are reviewed.
- User-facing errors and recovery states are represented by the API.
- Documentation and migration notes are updated.
