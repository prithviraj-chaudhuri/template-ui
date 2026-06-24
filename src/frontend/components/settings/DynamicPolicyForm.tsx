import { useEffect, useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchPolicySchema,
  fetchPolicySettings,
  fetchPolicyDefaults,
  savePolicySettings,
  resetPolicySettings,
  validatePolicySettings,
  updateDraft,
  discardChanges,
  setValidationErrors,
} from '../../redux/slices/policySettings';
import { addToast } from '../../redux/slices/toasts';
import { validateAgainstSchema } from '../../lib/schemaValidator';
import {
  sortSections,
  isFieldVisible,
  getFieldValue,
  pickSchemaFields,
} from '../../lib/policyFormUtils';
import { SectionGroup } from '../policy/SectionGroup';
import { FieldRenderer } from '../policy/FieldRenderer';
import { FormActions } from '../policy/FormActions';
import { ValidationErrors } from '../policy/ValidationErrors';

interface DynamicPolicyFormProps {
  templateId: string;
  userId: string;
}

export function DynamicPolicyForm({ templateId, userId }: DynamicPolicyFormProps) {
  const dispatch = useAppDispatch();
  const {
    schema,
    settings,
    defaults,
    draft,
    validationErrors,
    loading,
    error,
    hasUnsavedChanges,
  } = useAppSelector((state) => state.policySettings);

  useEffect(() => {
    dispatch(fetchPolicySchema(templateId));
    dispatch(fetchPolicySettings(userId));
    dispatch(fetchPolicyDefaults());
  }, [dispatch, templateId, userId]);

  const sortedSections = useMemo(
    () => (schema ? sortSections(schema) : []),
    [schema],
  );

  const handleFieldChange = (fieldName: string, value: unknown) => {
    dispatch(updateDraft({ [fieldName]: value }));
  };

  const handleSave = async () => {
    if (!draft || !schema) return;

    const payload = pickSchemaFields(draft, schema);

    const clientValidation = validateAgainstSchema(payload, schema);
    if (!clientValidation.valid) {
      dispatch(setValidationErrors(clientValidation.errors));
      dispatch(addToast({ title: 'Fix validation errors before saving', variant: 'danger' }));
      return;
    }

    try {
      const serverValidation = await dispatch(
        validatePolicySettings({ templateId, settings: payload }),
      ).unwrap();

      if (!serverValidation.valid) {
        dispatch(setValidationErrors(serverValidation.errors));
        dispatch(addToast({ title: 'Settings failed validation', variant: 'danger' }));
        return;
      }

      await dispatch(savePolicySettings({ userId, settings: payload })).unwrap();
      dispatch(addToast({ title: 'Policy settings saved successfully', variant: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Failed to save policy settings', variant: 'danger' }));
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to default settings? This cannot be undone.')) return;

    try {
      await dispatch(resetPolicySettings(userId)).unwrap();
      dispatch(addToast({ title: 'Settings reset to defaults', variant: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Failed to reset settings', variant: 'danger' }));
    }
  };

  const handleDiscard = () => {
    dispatch(discardChanges());
  };

  if (loading && !schema) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading policy settings...
      </div>
    );
  }

  if (!schema || !draft) {
    return (
      <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        {error || 'Failed to load policy schema'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-blue-400/80">{schema.description}</p>
        </div>
      </div>

      {sortedSections.map(({ id, section, fields }) => {
        const visibleFields = fields.filter(({ name }) => isFieldVisible(schema, name, draft));

        if (visibleFields.length === 0) return null;

        return (
          <SectionGroup key={id} section={section}>
            {visibleFields.map(({ name, schema: fieldSchema }) => (
              <FieldRenderer
                key={name}
                name={name}
                schema={fieldSchema}
                value={getFieldValue(draft, name, fieldSchema)}
                onChange={handleFieldChange}
              />
            ))}
          </SectionGroup>
        );
      })}

      <ValidationErrors errors={validationErrors} />

      <FormActions
        hasCustomSettings={!!settings}
        hasUnsavedChanges={hasUnsavedChanges}
        loading={loading}
        onSave={handleSave}
        onReset={handleReset}
        onDiscard={handleDiscard}
      />

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
