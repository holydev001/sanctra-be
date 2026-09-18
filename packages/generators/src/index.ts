export interface GenerationPlanFile {
  path: string;
  operation: 'create' | 'update' | 'skip' | 'conflict';
  contentHash: string;
}

export interface GenerationPlan {
  target: string;
  templateVersion: string;
  files: GenerationPlanFile[];
}
