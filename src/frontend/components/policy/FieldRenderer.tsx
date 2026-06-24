import { memo, type ReactNode } from 'react';
import { Switch, TextInput, FormGroup } from '@patternfly/react-core';
import type { PropertySchema } from '../../types/policy';
import { NumberSlider } from './NumberSlider';
import { TagsInput } from './TagsInput';

interface FieldRendererProps {
  name: string;
  schema: PropertySchema;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
  error?: string;
}

export const FieldRenderer = memo(function FieldRenderer({
  name,
  schema,
  value,
  onChange,
  disabled = false,
  error,
}: FieldRendererProps) {
  const fieldId = `policy-field-${name}`;
  const widget = schema.ui.widget;

  const handleChange = (newValue: unknown) => {
    onChange(name, newValue);
  };

  let control: ReactNode;

  switch (widget) {
    case 'slider':
      control = (
        <NumberSlider
          id={fieldId}
          value={Number(value ?? schema.default ?? schema.minimum ?? 0)}
          onChange={(v) => handleChange(v)}
          min={schema.minimum}
          max={schema.maximum}
          step={schema.ui.step ?? 1}
          disabled={disabled}
          showValue={schema.ui.showValue ?? true}
        />
      );
      break;

    case 'number':
      control = (
        <TextInput
          id={fieldId}
          type="number"
          value={String(value ?? schema.default ?? '')}
          onChange={(_event, v) => handleChange(parseInt(v, 10) || 0)}
          min={schema.minimum}
          max={schema.maximum}
          isDisabled={disabled}
          validated={error ? 'error' : 'default'}
        />
      );
      break;

    case 'toggle':
      control = (
        <Switch
          id={fieldId}
          aria-label={schema.title}
          isChecked={Boolean(value ?? schema.default ?? false)}
          onChange={(_event, checked) => handleChange(checked)}
          isDisabled={disabled}
        />
      );
      break;

    case 'tags':
      control = (
        <TagsInput
          id={fieldId}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(v) => handleChange(v)}
          placeholder={schema.ui.placeholder}
          disabled={disabled}
          maxItems={schema.maxItems}
        />
      );
      break;

    case 'text':
    default:
      control = (
        <TextInput
          id={fieldId}
          value={String(value ?? schema.default ?? '')}
          onChange={(_event, v) => handleChange(v)}
          placeholder={schema.ui.placeholder}
          isDisabled={disabled}
          validated={error ? 'error' : 'default'}
        />
      );
      break;
  }

  if (widget === 'toggle') {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label htmlFor={fieldId} className="text-sm text-foreground">
              {schema.title}
            </label>
            {schema.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{schema.description}</p>
            )}
          </div>
          {control}
        </div>
        {error && (
          <p className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <FormGroup label={schema.title} fieldId={fieldId}>
      {control}
      {schema.description && (
        <p className="text-xs text-muted-foreground mt-1">{schema.description}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </FormGroup>
  );
});
