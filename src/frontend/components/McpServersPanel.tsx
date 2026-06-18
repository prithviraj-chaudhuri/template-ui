import React, { useEffect, useState } from 'react';
import { McpClient } from '@/api/mcpClient';

interface McpServer {
  name: string;
  url: string;
  status: 'connected' | 'needs-auth' | 'disconnected';
  tools: number;
  prompts: number;
  resources: number;
  error?: string | null;
  auth_url?: string | null;
}

interface McpServersResponse {
  servers: McpServer[];
}

export const McpServersPanel: React.FC = () => {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState<string | null>(null);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/mcp/servers');
      if (!response.ok) {
        throw new Error(`Failed to fetch MCP servers: ${response.statusText}`);
      }
      const data: McpServersResponse = await response.json();
      setServers(data.servers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthenticate = async (server: McpServer) => {
    if (!server.auth_url) return;

    try {
      setAuthenticating(server.name);
      await McpClient.authenticateWithPopup(server.auth_url, server.name);
      // Refresh servers after authentication
      await fetchServers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthenticating(null);
    }
  };

  const getStatusColor = (status: McpServer['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-400 bg-green-400/10';
      case 'needs-auth':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'disconnected':
        return 'text-red-400 bg-red-400/10';
    }
  };

  const getStatusIcon = (status: McpServer['status']) => {
    switch (status) {
      case 'connected':
        return '✓';
      case 'needs-auth':
        return '⚠';
      case 'disconnected':
        return '✗';
    }
  };

  if (loading && servers.length === 0) {
    return (
      <div className="p-4 bg-neutral-800 rounded-lg">
        <div className="animate-pulse text-neutral-400">Loading MCP servers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchServers}
          className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="p-4 bg-neutral-800 rounded-lg">
        <p className="text-neutral-400">No MCP servers configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-neutral-100">MCP Servers</h3>
        <button
          onClick={fetchServers}
          className="text-xs text-neutral-400 hover:text-neutral-200"
          title="Refresh"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="space-y-2">
        {servers.map((server) => (
          <div
            key={server.name}
            className="p-3 bg-neutral-800 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getStatusColor(
                      server.status
                    )}`}
                  >
                    {getStatusIcon(server.status)}
                  </span>
                  <h4 className="font-medium text-neutral-100">{server.name}</h4>
                </div>
                <p className="text-xs text-neutral-500 mt-1 ml-8">{server.url}</p>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="text-center">
                  <div className="text-neutral-400">Tools</div>
                  <div className="text-neutral-100 font-semibold">{server.tools}</div>
                </div>
                <div className="text-center">
                  <div className="text-neutral-400">Prompts</div>
                  <div className="text-neutral-100 font-semibold">{server.prompts}</div>
                </div>
                <div className="text-center">
                  <div className="text-neutral-400">Resources</div>
                  <div className="text-neutral-100 font-semibold">{server.resources}</div>
                </div>
              </div>
            </div>

            {server.error && (
              <div className="mt-2 ml-8 p-2 bg-red-900/20 border border-red-700/30 rounded text-xs text-red-400">
                {server.error}
              </div>
            )}

            {server.status === 'needs-auth' && server.auth_url && (
              <div className="mt-2 ml-8">
                <button
                  onClick={() => handleAuthenticate(server)}
                  disabled={authenticating === server.name}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-700 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
                >
                  {authenticating === server.name ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Connect
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-neutral-500 text-center">
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
};
