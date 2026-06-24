import { Alert } from '@patternfly/react-core';
import { AlertCircle } from 'lucide-react';

interface ValidationErrorsProps {
  errors: string[];
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <Alert
      variant="danger"
      title="Validation errors"
      isInline
      customIcon={<AlertCircle className="w-4 h-4" />}
    >
      <ul className="list-disc pl-4 space-y-1 text-sm">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </Alert>
  );
}
