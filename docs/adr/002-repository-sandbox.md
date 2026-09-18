# ADR 002 Repository Sandbox Strategy

## Status

Proposed

## Decision

Repository analysis will run in an ephemeral worker sandbox. The worker will resolve an immutable commit SHA, fetch only the approved repository material, apply size and file-count limits, exclude binaries, restrict network access where possible, and delete temporary material after the job.

## Open decisions

- Select the production sandbox runtime.
- Define maximum repository size, file count, and job duration.
- Define retention duration for reports and large artifacts.
- Add SSRF and path-traversal security tests before GitHub write functionality is enabled.
