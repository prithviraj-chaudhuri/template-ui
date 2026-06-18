import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MCPServerStatus = 'connected' | 'disconnected' | 'needs-auth' | 'unknown';

export interface MCPServer {
  name: string;
  url: string;
  transport: string;
  enabled: boolean;
  auth: boolean;
  ssl_verify: boolean;
  timeout: number;
  status: MCPServerStatus;
  tools?: number;
  prompts?: number;
  resources?: number;
  error?: string;
}

interface MCPServersState {
  servers: MCPServer[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: MCPServersState = {
  servers: [],
  loading: false,
  error: null,
  lastFetch: null,
};

const mcpServersSlice = createSlice({
  name: 'mcpServers',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setServers(state, action: PayloadAction<MCPServer[]>) {
      state.servers = action.payload;
      state.lastFetch = Date.now();
      state.loading = false;
      state.error = null;
    },
    updateServerStatus(
      state,
      action: PayloadAction<{
        name: string;
        status: MCPServerStatus;
        tools?: number;
        prompts?: number;
        resources?: number;
        error?: string;
      }>
    ) {
      const server = state.servers.find((s) => s.name === action.payload.name);
      if (server) {
        server.status = action.payload.status;
        if (action.payload.tools !== undefined) server.tools = action.payload.tools;
        if (action.payload.prompts !== undefined) server.prompts = action.payload.prompts;
        if (action.payload.resources !== undefined) server.resources = action.payload.resources;
        if (action.payload.error !== undefined) server.error = action.payload.error;
      }
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { setLoading, setServers, updateServerStatus, setError, clearError } =
  mcpServersSlice.actions;

export const selectMCPServers = (state: { mcpServers: MCPServersState }) =>
  state.mcpServers.servers;
export const selectMCPServersLoading = (state: { mcpServers: MCPServersState }) =>
  state.mcpServers.loading;
export const selectMCPServersError = (state: { mcpServers: MCPServersState }) =>
  state.mcpServers.error;
export const selectMCPServersLastFetch = (state: { mcpServers: MCPServersState }) =>
  state.mcpServers.lastFetch;

export default mcpServersSlice.reducer;
