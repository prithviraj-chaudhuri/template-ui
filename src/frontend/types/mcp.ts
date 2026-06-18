export interface McpServer {
  name: string;
  url: string;
  status: 'connected' | 'needs-auth' | 'disconnected';
  tools: number;
  prompts: number;
  resources: number;
  error?: string | null;
  auth_url?: string | null;
}

export interface McpServersResponse {
  servers: McpServer[];
}
