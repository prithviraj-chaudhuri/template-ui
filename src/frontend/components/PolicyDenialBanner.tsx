/**
 * Banner component displayed when a message contains policy denial content.
 * Shows a warning indicator and optionally the denial reasons.
 */

import { AlertCircle } from 'lucide-react';
import { extractDenialReasons } from '../utils/policyDenial';

interface PolicyDenialBannerProps {
  content: string;
  messageType?: 'llm' | 'tool';
  className?: string;
}

export function PolicyDenialBanner({ content, messageType = 'llm', className = '' }: PolicyDenialBannerProps) {
  const reasons = extractDenialReasons(content);

  return (
    <div
      className={`policy-denial-banner rounded-md border-l-4 border-red-500 bg-red-50 dark:bg-red-950 p-4 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">
            {messageType === 'tool' ? 'Subagent Response Blocked' : 'Content Moderation'}
          </h4>

          <p className="text-sm text-red-700 dark:text-red-400">
            This response was blocked by compliance policies.
          </p>

          {reasons.length > 0 && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-500">
              <span className="font-medium">Reason{reasons.length > 1 ? 's' : ''}:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-2 text-xs text-red-600 dark:text-red-500 italic">
            Please rephrase your request or contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
