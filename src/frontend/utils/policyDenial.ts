/**
 * Utility functions for detecting and handling OPA policy denial messages.
 */

export const POLICY_DENIAL_MARKER = "I'm unable to complete this request because it isn't allowed by our compliance policies";

/**
 * Check if a message content contains a policy denial.
 */
export function isPolicyDenialMessage(content: unknown): boolean {
  if (typeof content === 'string') {
    return content.includes(POLICY_DENIAL_MARKER);
  }

  if (Array.isArray(content)) {
    return content.some((block) => {
      if (typeof block === 'string') {
        return block.includes(POLICY_DENIAL_MARKER);
      }
      if (block && typeof block === 'object' && 'text' in block) {
        return typeof block.text === 'string' && block.text.includes(POLICY_DENIAL_MARKER);
      }
      return false;
    });
  }

  return false;
}

/**
 * Extract policy denial reasons from a denial message.
 */
export function extractDenialReasons(content: string): string[] {
  const reasonsMatch = content.match(/Reason\(s\):\s*((?:[-•]\s*.+\n?)+)/i);
  if (!reasonsMatch) return [];

  const reasonsText = reasonsMatch[1];
  return reasonsText
    .split('\n')
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Check if this is a tool/subagent policy denial.
 */
export function isToolPolicyDenial(toolResult: { content?: unknown; status?: string }): boolean {
  return (
    toolResult.status === 'error' &&
    isPolicyDenialMessage(toolResult.content)
  );
}
