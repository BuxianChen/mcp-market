import axios from 'axios';
import type { McpServer, CreateMcpServerInput, McpTestResult } from '../types/mcp';

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
  }
};
