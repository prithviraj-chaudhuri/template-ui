import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { JSONSchema, PolicySettings, ValidationResult } from '../../types/policy';
import {
  getFieldDefaultsFromSchema,
  mergeSettingsWithDefaults,
} from '../../lib/policyFormUtils';

interface SettingsResponse {
  user_id: string;
  settings: PolicySettings;
  updated_at: string | null;
}

interface PolicyState {
  schema: JSONSchema | null;
  templateId: string | null;
  settings: PolicySettings | null;
  defaults: PolicySettings | null;
  draft: PolicySettings | null;
  validationErrors: string[];
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

const initialState: PolicyState = {
  schema: null,
  templateId: null,
  settings: null,
  defaults: null,
  draft: null,
  validationErrors: [],
  loading: false,
  error: null,
  hasUnsavedChanges: false,
};

function hasCustomSettings(settings: PolicySettings | undefined): boolean {
  return !!settings && Object.keys(settings).length > 0;
}

function buildDraft(
  schema: JSONSchema | null,
  defaults: PolicySettings | null,
  settings: PolicySettings | null,
): PolicySettings {
  const schemaDefaults = schema ? getFieldDefaultsFromSchema(schema) : {};
  return mergeSettingsWithDefaults(schemaDefaults, defaults, settings, schema);
}

export const fetchPolicySchema = createAsyncThunk(
  'policySettings/fetchSchema',
  async (templateId: string) => {
    const response = await fetch(`/api/policy/schema/${encodeURIComponent(templateId)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch policy schema');
    return { templateId, schema: (await response.json()) as JSONSchema };
  },
);

export const fetchPolicySettings = createAsyncThunk(
  'policySettings/fetch',
  async (userId: string) => {
    const response = await fetch(`/api/policy/settings/${encodeURIComponent(userId)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json() as Promise<SettingsResponse>;
  },
);

export const fetchPolicyDefaults = createAsyncThunk('policySettings/fetchDefaults', async () => {
  const response = await fetch('/api/policy/defaults', { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch defaults');
  return response.json() as Promise<PolicySettings>;
});

export const savePolicySettings = createAsyncThunk(
  'policySettings/save',
  async ({ userId, settings }: { userId: string; settings: PolicySettings }) => {
    const response = await fetch(`/api/policy/settings/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error('Failed to save settings');
    return response.json() as Promise<SettingsResponse>;
  },
);

export const resetPolicySettings = createAsyncThunk(
  'policySettings/reset',
  async (userId: string) => {
    const response = await fetch(`/api/policy/settings/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to reset settings');
    return response.json();
  },
);

export const validatePolicySettings = createAsyncThunk(
  'policySettings/validate',
  async ({ templateId, settings }: { templateId: string; settings: PolicySettings }) => {
    const response = await fetch(`/api/policy/validate/${encodeURIComponent(templateId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) throw new Error('Failed to validate settings');
    return response.json() as Promise<ValidationResult>;
  },
);

const policySettingsSlice = createSlice({
  name: 'policySettings',
  initialState,
  reducers: {
    updateDraft(state, action: PayloadAction<Partial<PolicySettings>>) {
      state.draft = { ...(state.draft ?? {}), ...action.payload };
      state.hasUnsavedChanges = true;
      state.validationErrors = [];
    },
    discardChanges(state) {
      state.draft = buildDraft(state.schema, state.defaults, state.settings);
      state.hasUnsavedChanges = false;
      state.validationErrors = [];
    },
    setValidationErrors(state, action: PayloadAction<string[]>) {
      state.validationErrors = action.payload;
    },
    clearPolicyError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPolicySchema.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPolicySchema.fulfilled, (state, action) => {
      state.loading = false;
      state.schema = action.payload.schema;
      state.templateId = action.payload.templateId;
      state.draft = buildDraft(action.payload.schema, state.defaults, state.settings);
    });
    builder.addCase(fetchPolicySchema.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch policy schema';
    });

    builder.addCase(fetchPolicySettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPolicySettings.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = hasCustomSettings(action.payload.settings) ? action.payload.settings : null;
      state.draft = buildDraft(state.schema, state.defaults, state.settings);
      state.hasUnsavedChanges = false;
    });
    builder.addCase(fetchPolicySettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch settings';
    });

    builder.addCase(fetchPolicyDefaults.fulfilled, (state, action) => {
      state.defaults = action.payload;
      state.draft = buildDraft(state.schema, action.payload, state.settings);
    });
    builder.addCase(fetchPolicyDefaults.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to fetch defaults';
    });

    builder.addCase(savePolicySettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(savePolicySettings.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = hasCustomSettings(action.payload.settings) ? action.payload.settings : null;
      state.draft = buildDraft(state.schema, state.defaults, state.settings);
      state.hasUnsavedChanges = false;
      state.validationErrors = [];
    });
    builder.addCase(savePolicySettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to save settings';
    });

    builder.addCase(resetPolicySettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(resetPolicySettings.fulfilled, (state) => {
      state.loading = false;
      state.settings = null;
      state.draft = buildDraft(state.schema, state.defaults, null);
      state.hasUnsavedChanges = false;
      state.validationErrors = [];
    });
    builder.addCase(resetPolicySettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to reset settings';
    });

    builder.addCase(validatePolicySettings.fulfilled, (state, action) => {
      state.validationErrors = action.payload.valid ? [] : action.payload.errors;
    });
    builder.addCase(validatePolicySettings.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to validate settings';
    });
  },
});

export const { updateDraft, discardChanges, setValidationErrors, clearPolicyError } =
  policySettingsSlice.actions;

export default policySettingsSlice.reducer;
