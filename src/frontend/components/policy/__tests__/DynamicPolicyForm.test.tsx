import { describe, it, expect } from 'vitest';
import {
  groupFieldsBySection,
  sortSections,
  isFieldVisible,
  getFieldDefaultsFromSchema,
  mergeSettingsWithDefaults,
  pickSchemaFields,
} from '../../../lib/policyFormUtils';
import type { JSONSchema } from '../../../types/policy';

const mockSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  version: '1.0.0',
  title: 'Test Policy',
  description: 'Test schema',
  type: 'object',
  properties: {
    enable_tool_restrictions: {
      type: 'boolean',
      title: 'Enable Tool Restrictions',
      default: false,
      ui: { widget: 'toggle', section: 'tool_restrictions', order: 0, controls: ['blocked_tools'] },
    },
    blocked_tools: {
      type: 'array',
      title: 'Blocked Tools',
      default: [],
      items: { type: 'string' },
      ui: { widget: 'tags', section: 'tool_restrictions', order: 1 },
    },
    max_trajectory_length: {
      type: 'integer',
      title: 'Max Trajectory',
      default: 100,
      minimum: 1,
      maximum: 1000,
      ui: { widget: 'slider', section: 'limits', order: 1, step: 10 },
    },
  },
  sections: {
    limits: { title: 'Limits', description: 'Limit settings', icon: 'gauge', order: 1 },
    tool_restrictions: {
      title: 'Tool Restrictions',
      description: 'Tool access',
      icon: 'shield',
      order: 2,
    },
  },
};

describe('policyFormUtils', () => {
  it('extracts defaults from schema', () => {
    const defaults = getFieldDefaultsFromSchema(mockSchema);
    expect(defaults.enable_tool_restrictions).toBe(false);
    expect(defaults.blocked_tools).toEqual([]);
    expect(defaults.max_trajectory_length).toBe(100);
  });

  it('merges settings with defaults', () => {
    const merged = mergeSettingsWithDefaults(
      { max_trajectory_length: 100 },
      { max_trajectory_length: 50 },
      { blocked_tools: ['delete_file'] },
      mockSchema,
    );
    expect(merged.max_trajectory_length).toBe(50);
    expect(merged.blocked_tools).toEqual(['delete_file']);
    expect(merged.enable_tool_restrictions).toBe(false);
  });

  it('filters draft to schema-defined fields only', () => {
    const draft = {
      max_trajectory_length: 200,
      enable_trajectory_limits: true,
      extra_legacy_field: 'ignored',
    };
    const picked = pickSchemaFields(draft, mockSchema);
    expect(picked.max_trajectory_length).toBe(200);
    expect('extra_legacy_field' in picked).toBe(false);
  });

  it('groups fields by section', () => {
    const grouped = groupFieldsBySection(mockSchema);
    expect(grouped.limits).toHaveLength(1);
    expect(grouped.tool_restrictions).toHaveLength(2);
    expect(grouped.tool_restrictions[0].name).toBe('enable_tool_restrictions');
  });

  it('sorts sections by order', () => {
    const sections = sortSections(mockSchema);
    expect(sections.map((s) => s.id)).toEqual(['limits', 'tool_restrictions']);
  });

  it('hides controlled fields when toggle is off', () => {
    expect(isFieldVisible(mockSchema, 'blocked_tools', { enable_tool_restrictions: false })).toBe(
      false,
    );
    expect(isFieldVisible(mockSchema, 'blocked_tools', { enable_tool_restrictions: true })).toBe(
      true,
    );
    expect(isFieldVisible(mockSchema, 'max_trajectory_length', {})).toBe(true);
  });
});
