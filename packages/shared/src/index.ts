export const QUEUE_NAMES = {
  analysis: 'analysis',
  generation: 'generation',
  githubWrite: 'github-write',
  webhook: 'webhook',
  cleanup: 'cleanup',
} as const;

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'warning' | 'failed' | 'blocked';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'pip' | 'poetry' | 'composer' | 'unknown';

export interface PackageManagerDetection {
  manager: PackageManager;
  evidence: string[];
  confidence: number;
}
