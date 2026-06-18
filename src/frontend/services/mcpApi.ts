import { MCPServer } from '@/redux/slices/mcpServers';

export class MCPApi {
  /**
   * Fetch all configured MCP servers from the agent
   */
  static async fetchServers(): Promise<MCPServer[]> {
    try {
      const response = await fetch('/api/mcp/servers', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch MCP servers: ${response.status}`);
      }

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('MCP server endpoints not yet implemented in the agent backend');
      }

      const data = await response.json();
      return data.servers || [];
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('MCP server endpoints not yet implemented in the agent backend');
      }
      throw error;
    }
  }

  /**
   * Check the status of a specific MCP server
   */
  static async checkServerStatus(serverName: string): Promise<{
    status: 'connected' | 'disconnected' | 'needs-auth';
    tools?: number;
    prompts?: number;
    resources?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `/api/mcp/servers/${encodeURIComponent(serverName)}/status`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return {
          status: 'disconnected',
          error: `HTTP ${response.status}`,
        };
      }

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          status: 'disconnected',
          error: 'Backend endpoint not implemented',
        };
      }

      return await response.json();
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check all server statuses in parallel
   */
  static async checkAllStatuses(serverNames: string[]): Promise<
    Map<
      string,
      {
        status: 'connected' | 'disconnected' | 'needs-auth';
        tools?: number;
        prompts?: number;
        resources?: number;
        error?: string;
      }
    >
  > {
    const results = await Promise.allSettled(
      serverNames.map((name) => this.checkServerStatus(name))
    );

    const statusMap = new Map();
    serverNames.forEach((name, idx) => {
      const result = results[idx];
      if (result.status === 'fulfilled') {
        statusMap.set(name, result.value);
      } else {
        statusMap.set(name, {
          status: 'disconnected' as const,
          error: 'Failed to check status',
        });
      }
    });

    return statusMap;
  }
}
