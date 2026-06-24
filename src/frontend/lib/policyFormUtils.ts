import type {
  JSONSchema,
  PolicyField,
  PolicySection,
  PolicySettings,
  PropertySchema,
} from '../types/policy';

export function getFieldDefaultsFromSchema(schema: JSONSchema): PolicySettings {
  const defaults: PolicySettings = {};
  for (const [name, prop] of Object.entries(schema.properties)) {
    if ('default' in prop) {
      defaults[name] = prop.default;
    }
  }
  return defaults;
}

function defaultForProperty(prop: PropertySchema): unknown {
  if ('default' in prop) return prop.default;
  if (prop.type === 'array') return [];
  if (prop.type === 'boolean') return false;
  if (prop.type === 'integer' || prop.type === 'number') return prop.minimum ?? 0;
  return '';
}

/** Keep only fields defined in the schema — ignores extra keys from the defaults API. */
export function pickSchemaFields(
  draft: PolicySettings,
  schema: JSONSchema,
): PolicySettings {
  return Object.fromEntries(
    Object.keys(schema.properties).map((key) => [
      key,
      key in draft ? draft[key] : defaultForProperty(schema.properties[key]),
    ]),
  );
}

export function mergeSettingsWithDefaults(
  schemaDefaults: PolicySettings | null,
  apiDefaults: PolicySettings | null,
  userSettings: PolicySettings | null,
  schema?: JSONSchema | null,
): PolicySettings {
  const merged = {
    ...(schemaDefaults ?? {}),
    ...(apiDefaults ?? {}),
    ...(userSettings ?? {}),
  };

  if (schema) {
    return pickSchemaFields(merged, schema);
  }

  return merged;
}

export function groupFieldsBySection(schema: JSONSchema): Record<string, PolicyField[]> {
  const grouped: Record<string, PolicyField[]> = {};

  for (const [name, propSchema] of Object.entries(schema.properties)) {
    const sectionId = propSchema.ui.section;
    if (!grouped[sectionId]) grouped[sectionId] = [];
    grouped[sectionId].push({ name, schema: propSchema });
  }

  for (const fields of Object.values(grouped)) {
    fields.sort((a, b) => a.schema.ui.order - b.schema.ui.order);
  }

  return grouped;
}

export function sortSections(schema: JSONSchema): PolicySection[] {
  const fieldsBySection = groupFieldsBySection(schema);
  const sections = schema.sections ?? {};

  return Object.entries(sections)
    .map(([id, section]) => ({
      id,
      section,
      fields: fieldsBySection[id] ?? [],
    }))
    .filter((s) => s.fields.length > 0)
    .sort((a, b) => a.section.order - b.section.order);
}

export function getControllerForField(schema: JSONSchema, fieldName: string): string | null {
  for (const [name, prop] of Object.entries(schema.properties)) {
    if (prop.ui.controls?.includes(fieldName)) {
      return name;
    }
  }
  return null;
}

export function isFieldVisible(
  schema: JSONSchema,
  fieldName: string,
  draft: PolicySettings,
): boolean {
  const controller = getControllerForField(schema, fieldName);
  if (!controller) return true;
  return Boolean(draft[controller]);
}

export function getFieldValue(
  draft: PolicySettings,
  name: string,
  propSchema: PropertySchema,
): unknown {
  if (name in draft) return draft[name];
  if ('default' in propSchema) return propSchema.default;
  if (propSchema.type === 'array') return [];
  if (propSchema.type === 'boolean') return false;
  if (propSchema.type === 'integer' || propSchema.type === 'number') return propSchema.minimum ?? 0;
  return '';
}
