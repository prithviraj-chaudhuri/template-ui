import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  selectMCPServers,
  selectMCPServersLoading,
  selectMCPServersError,
  setLoading,
  setServers,
  setError,
  type MCPServerStatus,
} from '@/redux/slices/mcpServers';
import { MCPApi } from '@/services/mcpApi';

function getStatusConfig(status: MCPServerStatus) {
  switch (status) {
    case 'connected':
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        label: 'Connected',
      };
    case 'disconnected':
      return {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Disconnected',
      };
    case 'needs-auth':
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        label: 'Needs authentication',
      };
    case 'unknown':
      return {
        icon: AlertCircle,
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10',
        label: 'Unknown',
      };
  }
}

export function MCPSettings() {
  const dispatch = useAppDispatch();
  const servers = useAppSelector(selectMCPServers);
  const loading = useAppSelector(selectMCPServersLoading);
  const error = useAppSelector(selectMCPServersError);

  // Load servers on mount
  useEffect(() => {
    loadServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadServers = async () => {
    try {
      dispatch(setLoading(true));
      const fetchedServers = await MCPApi.fetchServers();
      dispatch(setServers(fetchedServers));
    } catch (err) {
      dispatch(setError(String(err)));
    }
  };

  const refreshServerStatus = async () => {
    // Refresh all servers since the endpoint returns status for all servers
    await loadServers();
  };

  return (
    <div className="space-y-4">
      <br />
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-400/80">
          Model Context Protocol servers provide tools, prompts, and resources to extend agent
          capabilities.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-red-400 mb-1">{error}</p>
            {error.includes('not yet implemented') && (
              <p className="text-xs text-red-400/70">
                The agent backend needs to implement the <code className="px-1 py-0.5 rounded bg-red-500/10">/mcp/servers</code> endpoint.
              </p>
            )}
          </div>
        </div>
      )}

      {loading && servers.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading MCP servers...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => {
            const statusConfig = getStatusConfig(server.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={server.name}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
              >
                {/* Server Icon/Avatar */}
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {server.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Server Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {server.name}
                    </h4>
                    <StatusIcon className={`w-4 h-4 shrink-0 ${statusConfig.color}`} />
                  </div>

                  {server.status === 'needs-auth' ? (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      {statusConfig.label}
                    </p>
                  ) : server.error ? (
                    <p className="text-xs text-red-600 dark:text-red-500">{server.error}</p>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {server.tools !== undefined && <span>{server.tools} tools</span>}
                      {server.prompts !== undefined && <span>{server.prompts} prompts</span>}
                      {server.resources !== undefined && (
                        <span>{server.resources} resources</span>
                      )}
                      {server.status === 'unknown' && <span>Status unknown</span>}
                    </div>
                  )}
                </div>

                {/* Auth Button or Refresh Button */}
                {server.status === 'needs-auth' && server.auth_url ? (
                  <a
                    href={server.auth_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Authenticate
                  </a>
                ) : (
                  <button
                    onClick={() => refreshServerStatus()}
                    className="p-2 hover:bg-secondary rounded-md transition-colors"
                    title="Refresh status"
                  >
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}

                {/* Status Indicator Toggle */}
                <div className="shrink-0">
                  {server.status === 'connected' ? (
                    <div
                      className={`w-10 h-6 rounded-full ${statusConfig.bgColor} flex items-center justify-end px-1`}
                    >
                      <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm" />
                    </div>
                  ) : (
                    <div
                      className={`w-10 h-6 rounded-full ${statusConfig.bgColor} flex items-center justify-start px-1 opacity-50`}
                    >
                      <div className="w-4 h-4 rounded-full bg-gray-400 shadow-sm" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {servers.length === 0 && !loading && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No MCP servers configured
            </div>
          )}
        </div>
      )}
    </div>
  );
}
