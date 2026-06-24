import { Button } from '@patternfly/react-core';
import { RotateCcw, Save, Undo2 } from 'lucide-react';

interface FormActionsProps {
  hasCustomSettings: boolean;
  hasUnsavedChanges: boolean;
  loading: boolean;
  onSave: () => void;
  onReset: () => void;
  onDiscard: () => void;
}

export function FormActions({
  hasCustomSettings,
  hasUnsavedChanges,
  loading,
  onSave,
  onReset,
  onDiscard,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <div className="text-xs text-muted-foreground">
        {hasCustomSettings ? 'Using custom settings' : 'Using default settings'}
        {hasUnsavedChanges && <span className="text-amber-500 ml-2">· Unsaved changes</span>}
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        {hasUnsavedChanges && (
          <Button
            variant="plain"
            size="sm"
            onClick={onDiscard}
            isDisabled={loading}
            icon={<Undo2 className="w-4 h-4" />}
          >
            Discard changes
          </Button>
        )}
        {hasCustomSettings && (
          <Button
            variant="plain"
            size="sm"
            onClick={onReset}
            isDisabled={loading}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset to defaults
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          isDisabled={!hasUnsavedChanges || loading}
          isLoading={loading}
          onClick={onSave}
          icon={<Save className="w-4 h-4" />}
        >
          Save settings
        </Button>
      </div>
    </div>
  );
}
