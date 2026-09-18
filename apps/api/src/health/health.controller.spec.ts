import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the API health status', () => {
    expect(new HealthController().getHealth()).toEqual({ status: 'ok', service: 'api' });
  });
});
