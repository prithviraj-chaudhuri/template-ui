export type WidgetType = 'text' | 'number' | 'slider' | 'toggle' | 'tags';

export interface PropertyUI {
  widget: WidgetType;
  section: string;
  order: number;
  controls?: string[];
  placeholder?: string;
  step?: number;
  showValue?: boolean;
}

export interface PropertySchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
  title: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: { type: string; pattern?: string };
  uniqueItems?: boolean;
  maxItems?: number;
  ui: PropertyUI;
}

export interface SectionSchema {
  title: string;
  description: string;
  icon: string;
  order: number;
}

export interface JSONSchema {
  $schema: string;
  version: string;
  title: string;
  description: string;
  type: 'object';
  properties: Record<string, PropertySchema>;
  sections?: Record<string, SectionSchema>;
}

export type PolicySettings = Record<string, unknown>;

export interface PolicyField {
  name: string;
  schema: PropertySchema;
}

export interface PolicySection {
  id: string;
  section: SectionSchema;
  fields: PolicyField[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
