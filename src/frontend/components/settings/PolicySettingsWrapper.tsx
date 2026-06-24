import { DynamicPolicyForm } from './DynamicPolicyForm';

export function PolicySettingsWrapper() {
  const userId = window.USER_DATA?.preferred_username || 'anonymous';
  return <DynamicPolicyForm templateId="agent_authz" userId={userId} />;
}
