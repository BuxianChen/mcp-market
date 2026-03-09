export type ConnectionType = 'http' | 'stdio' | 'sse';
export type McpStatus = 'active' | 'inactive';

export interface HttpConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface SseConfig {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface StdioConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export type ConnectionConfig = HttpConfig | SseConfig | StdioConfig;

export interface McpServer {
  id: number;
  name: string;
  description: string | null;
  connection_type: ConnectionType;
  connection_config: ConnectionConfig;
  status: McpStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateMcpServerInput {
  name: string;
  description?: string;
  connection_type: ConnectionType;
  connection_config: ConnectionConfig;
  status?: McpStatus;
}

export interface UpdateMcpServerInput {
  name?: string;
  description?: string;
  connection_type?: ConnectionType;
  connection_config?: ConnectionConfig;
  status?: McpStatus;
}

export interface McpTestResult {
  success: boolean;
  message: string;
  serverInfo?: {
    name: string;
    version: string;
    protocolVersion?: string;
  };
  capabilities?: {
    tools?: Array<{ name: string; description?: string; inputSchema?: any }>;
    resources?: Array<{ uri: string; name?: string; description?: string }>;
    prompts?: Array<{ name: string; description?: string; arguments?: any[] }>;
  };
  error?: string;
}

// Session related types
export interface SessionInfo {
  id: string;
  serverId: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface ToolCallRequest {
  toolName: string;
  arguments: Record<string, any>;
}

export interface ToolCallResult {
  success: boolean;
  content?: any;
  error?: string;
}

export interface ResourceReadResult {
  success: boolean;
  contents?: any[];
  error?: string;
}

export interface PromptGetRequest {
  promptName: string;
  arguments?: Record<string, any>;
}

export interface PromptGetResult {
  success: boolean;
  messages?: any[];
  error?: string;
}
