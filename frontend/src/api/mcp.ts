import axios from 'axios';
import type {
  McpServer,
  CreateMcpServerInput,
  McpTestResult,
  SessionInfo,
  ToolCallRequest,
  ToolCallResult,
  ResourceReadResult,
  PromptGetRequest,
  PromptGetResult,
  Tool,
  Resource,
  Prompt
} from '../types/mcp';

const API_BASE_URL = '/api';

export const mcpApi = {
  // 获取所有 MCP Server
  getAllMcps: async (): Promise<McpServer[]> => {
    const response = await axios.get(`${API_BASE_URL}/mcps`);
    return response.data;
  },

  // 获取单个 MCP Server
  getMcpById: async (id: number): Promise<McpServer> => {
    const response = await axios.get(`${API_BASE_URL}/mcps/${id}`);
    return response.data;
  },

  // 创建 MCP Server
  createMcp: async (input: CreateMcpServerInput): Promise<McpServer> => {
    const response = await axios.post(`${API_BASE_URL}/mcps`, input);
    return response.data;
  },

  // 更新 MCP Server
  updateMcp: async (id: number, input: Partial<CreateMcpServerInput>): Promise<McpServer> => {
    const response = await axios.put(`${API_BASE_URL}/mcps/${id}`, input);
    return response.data;
  },

  // 删除 MCP Server
  deleteMcp: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/mcps/${id}`);
  },

  // 测试 MCP Server 连接
  testMcp: async (id: number): Promise<McpTestResult> => {
    const response = await axios.post(`${API_BASE_URL}/mcps/${id}/test`);
    return response.data;
  },

  // Session Management
  createSession: async (id: number): Promise<SessionInfo> => {
    const response = await axios.post(`${API_BASE_URL}/mcps/${id}/sessions`);
    return response.data;
  },

  closeSession: async (id: number, sessionId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/mcps/${id}/sessions/${sessionId}`);
  },

  // Interactive Testing
  callTool: async (id: number, sessionId: string, request: ToolCallRequest): Promise<ToolCallResult> => {
    const response = await axios.post(
      `${API_BASE_URL}/mcps/${id}/sessions/${sessionId}/call-tool`,
      request
    );
    return response.data;
  },

  listResources: async (id: number, sessionId: string): Promise<Resource[]> => {
    const response = await axios.get(`${API_BASE_URL}/mcps/${id}/sessions/${sessionId}/resources`);
    return response.data.resources;
  },

  readResource: async (id: number, sessionId: string, uri: string): Promise<ResourceReadResult> => {
    const response = await axios.get(
      `${API_BASE_URL}/mcps/${id}/sessions/${sessionId}/resources/read`,
      { params: { uri } }
    );
    return response.data;
  },

  listPrompts: async (id: number, sessionId: string): Promise<Prompt[]> => {
    const response = await axios.get(`${API_BASE_URL}/mcps/${id}/sessions/${sessionId}/prompts`);
    return response.data.prompts;
  },

  getPrompt: async (id: number, sessionId: string, request: PromptGetRequest): Promise<PromptGetResult> => {
    const response = await axios.post(
      `${API_BASE_URL}/mcps/${id}/sessions/${sessionId}/prompts/${request.promptName}`,
      { arguments: request.arguments }
    );
    return response.data;
  },

  // Token Management
  createToken: async (id: number, data: { name?: string; permissions?: string[]; expiresAt?: string }): Promise<any> => {
    const response = await axios.post(`${API_BASE_URL}/mcps/${id}/tokens`, data);
    return response.data;
  },

  listTokens: async (id: number): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/mcps/${id}/tokens`);
    return response.data;
  },

  deleteToken: async (id: number, tokenId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/mcps/${id}/tokens/${tokenId}`);
  },

  // Access Logs
  getAccessLogs: async (id: number, limit?: number, offset?: number): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/mcps/${id}/logs`, {
      params: { limit, offset }
    });
    return response.data;
  },

  // HTTP to MCP Mappings
  createHttpMapping: async (id: number, data: any): Promise<any> => {
    const response = await axios.post(`${API_BASE_URL}/mcps/${id}/http-mappings`, data);
    return response.data;
  },

  listHttpMappings: async (id: number): Promise<any> => {
    const response = await axios.get(`${API_BASE_URL}/mcps/${id}/http-mappings`);
    return response.data;
  },

  updateHttpMapping: async (id: number, mappingId: number, data: any): Promise<void> => {
    await axios.put(`${API_BASE_URL}/mcps/${id}/http-mappings/${mappingId}`, data);
  },

  deleteHttpMapping: async (id: number, mappingId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/mcps/${id}/http-mappings/${mappingId}`);
  }
};
