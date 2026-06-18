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

}
