import type { JSONSchema } from '../types/policy';

export function validateAgainstSchema(
  data: Record<string, unknown>,
  schema: JSONSchema,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const properties = schema.properties ?? {};

  for (const [fieldName, propSchema] of Object.entries(properties)) {
    if (!(fieldName in data)) continue;

    const value = data[fieldName];
    const expectedType = propSchema.type;

    if (expectedType === 'integer' && !Number.isInteger(value)) {
      errors.push(`${fieldName}: expected integer, got ${typeof value}`);
    } else if (expectedType === 'number' && typeof value !== 'number') {
      errors.push(`${fieldName}: expected number, got ${typeof value}`);
    } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${fieldName}: expected boolean, got ${typeof value}`);
    } else if (expectedType === 'array' && !Array.isArray(value)) {
      errors.push(`${fieldName}: expected array, got ${typeof value}`);
    } else if (expectedType === 'string' && typeof value !== 'string') {
      errors.push(`${fieldName}: expected string, got ${typeof value}`);
    }

    if (
      (expectedType === 'integer' || expectedType === 'number') &&
      typeof value === 'number'
    ) {
      if (propSchema.minimum !== undefined && value < propSchema.minimum) {
        errors.push(`${fieldName}: ${value} < minimum ${propSchema.minimum}`);
      }
      if (propSchema.maximum !== undefined && value > propSchema.maximum) {
        errors.push(`${fieldName}: ${value} > maximum ${propSchema.maximum}`);
      }
    }

    if (expectedType === 'array' && Array.isArray(value)) {
      if (propSchema.maxItems !== undefined && value.length > propSchema.maxItems) {
        errors.push(`${fieldName}: ${value.length} items > max ${propSchema.maxItems}`);
      }
      if (propSchema.uniqueItems && new Set(value).size !== value.length) {
        errors.push(`${fieldName}: contains duplicate items`);
      }
      const pattern = propSchema.items?.pattern;
      if (pattern) {
        const re = new RegExp(pattern);
        for (const item of value) {
          if (typeof item === 'string' && !re.test(item)) {
            errors.push(`${fieldName}: "${item}" does not match required pattern`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
