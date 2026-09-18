import type { PackageManagerDetection } from '@sanctra/shared';

const packageManagerEvidence: ReadonlyArray<readonly [string, PackageManagerDetection]> = [
  ['pnpm-lock.yaml', { manager: 'pnpm', evidence: ['pnpm-lock.yaml'], confidence: 1 }],
  ['yarn.lock', { manager: 'yarn', evidence: ['yarn.lock'], confidence: 1 }],
  ['package-lock.json', { manager: 'npm', evidence: ['package-lock.json'], confidence: 1 }],
  ['poetry.lock', { manager: 'poetry', evidence: ['poetry.lock'], confidence: 1 }],
  ['composer.lock', { manager: 'composer', evidence: ['composer.lock'], confidence: 1 }],
  ['requirements.txt', { manager: 'pip', evidence: ['requirements.txt'], confidence: 0.8 }],
];

export function detectPackageManager(files: readonly string[]): PackageManagerDetection {
  for (const [filename, detection] of packageManagerEvidence) {
    if (files.includes(filename)) {
      return detection;
    }
  }

  return { manager: 'unknown', evidence: [], confidence: 0 };
}
