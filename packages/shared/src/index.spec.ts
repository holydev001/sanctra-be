import { describe, expect, it } from 'vitest';
import { QUEUE_NAMES } from './index';

describe('shared queue names', () => {
  it('keeps analysis queue naming stable', () => {
    expect(QUEUE_NAMES.analysis).toBe('analysis');
  });
});
