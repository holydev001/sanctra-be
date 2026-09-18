export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationFinding {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
}
