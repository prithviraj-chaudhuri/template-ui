import { useState } from 'react';
import { Button } from '@patternfly/react-core';
import { AlertCircle, Shield, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  clearRegoPolicy,
  selectRegoPolicy,
  setRegoPolicy,
} from '../../redux/slices/personalization';

const REGO_PLACEHOLDER = `package example.authz

default allow = false

allow {
  input.user.role == "admin"
}`;

export function RegoPoliciesEditor() {
  const dispatch = useAppDispatch();
  const savedPolicy = useAppSelector(selectRegoPolicy);
  const [draft, setDraft] = useState(savedPolicy);
  const hasUnsavedChanges = draft !== savedPolicy;

  const handleSave = () => {
    dispatch(setRegoPolicy(draft));
  };

  const handleClear = () => {
    setDraft('');
    dispatch(clearRegoPolicy());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <AlertCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-400/80">
          Paste or write Rego policy definitions here. Policies use the Open Policy Agent
          (OPA) language to define authorization and guardrail rules.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="rego-policy" className="text-sm font-medium text-foreground">
          Rego policy
        </label>
        <textarea
          id="rego-policy"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={REGO_PLACEHOLDER}
          spellCheck={false}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm resize-y min-h-[280px] border-0 bg-secondary/50 placeholder:opacity-60 focus:bg-card focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none font-mono leading-relaxed"
          style={{ border: '1px solid var(--border)', boxShadow: 'none' }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          {savedPolicy.trim() ? 'Policy saved locally' : 'No policy saved'}
          {hasUnsavedChanges && (
            <span className="text-amber-500">· Unsaved changes</span>
          )}
        </div>
        <div className="flex gap-2">
          {savedPolicy.trim() && (
            <Button
              variant="plain"
              isDanger
              size="sm"
              onClick={handleClear}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Clear
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            isDisabled={!hasUnsavedChanges}
            onClick={handleSave}
          >
            Save policy
          </Button>
        </div>
      </div>
    </div>
  );
}
