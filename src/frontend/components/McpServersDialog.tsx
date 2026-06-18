import React, { useState } from 'react';
import { McpServersPanel } from './McpServersPanel';

export const McpServersDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg z-50"
        title="MCP Servers"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-neutral-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-neutral-100">MCP Servers Status</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <McpServersPanel />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
