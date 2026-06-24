import { describe, it, expect } from 'vitest';
import { validateAgainstSchema } from './schemaValidator';
import type { JSONSchema } from '../types/policy';

const schema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  version: '1.0.0',
  title: 'Test',
  description: 'Test',
  type: 'object',
  properties: {
    max_trajectory_length: {
      type: 'integer',
      title: 'Max Trajectory',
      default: 100,
      minimum: 1,
      maximum: 1000,
      ui: { widget: 'slider', section: 'limits', order: 1 },
    },
    blocked_tools: {
      type: 'array',
      title: 'Blocked Tools',
      default: [],
      items: { type: 'string' },
      ui: { widget: 'tags', section: 'tool_restrictions', order: 1 },
    },
  },
};

describe('schemaValidator', () => {
  it('validates correct data', () => {
    const result = validateAgainstSchema(
      { max_trajectory_length: 50, blocked_tools: ['delete_file'] },
      schema,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects out-of-range values', () => {
    const result = validateAgainstSchema({ max_trajectory_length: 5000, blocked_tools: [] }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
