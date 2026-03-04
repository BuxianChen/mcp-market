import type { McpServer, CreateMcpServerInput, UpdateMcpServerInput } from '../types/mcp';
import { mcpDatabase } from '../db/database';

export class McpService {
  getAllMcpServers(): McpServer[] {
    return mcpDatabase.getAllMcpServers();
  }

  getMcpServerById(id: number): McpServer | null {
    return mcpDatabase.getMcpServerById(id);
  }

  createMcpServer(input: CreateMcpServerInput): McpServer {
    return mcpDatabase.createMcpServer(input);
  }

  updateMcpServer(id: number, input: UpdateMcpServerInput): McpServer | null {
    return mcpDatabase.updateMcpServer(id, input);
  }

  deleteMcpServer(id: number): boolean {
    return mcpDatabase.deleteMcpServer(id);
  }
}

export const mcpService = new McpService();
