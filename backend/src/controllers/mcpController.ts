import { Request, Response } from 'express';
import { mcpService } from '../services/mcpService';
import { mcpTestService } from '../services/mcpTestService';
import { z } from 'zod';

// 验证 schema
const connectionConfigSchema = z.union([
  z.object({
    type: z.literal('http'),
    url: z.string().url(),
    headers: z.record(z.string()).optional(),
    timeout: z.number().optional()
  }),
  z.object({
    type: z.literal('sse'),
    url: z.string().url(),
    headers: z.record(z.string()).optional(),
    timeout: z.number().optional()
  }),
  z.object({
    type: z.literal('stdio'),
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional()
  })
]);

const createMcpSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  connection_type: z.enum(['http', 'stdio', 'sse']),
  connection_config: connectionConfigSchema,
  status: z.enum(['active', 'inactive']).optional()
});

const updateMcpSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  connection_type: z.enum(['http', 'stdio', 'sse']).optional(),
  connection_config: connectionConfigSchema.optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export class McpController {
  // GET /api/mcps
  getAllMcps(req: Request, res: Response) {
    try {
      const mcps = mcpService.getAllMcpServers();
      res.json(mcps);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // GET /api/mcps/:id
  getMcpById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const mcp = mcpService.getMcpServerById(id);
      if (!mcp) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      res.json(mcp);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // POST /api/mcps
  async createMcp(req: Request, res: Response) {
    try {
      const validated = createMcpSchema.parse(req.body);
      const mcp = mcpService.createMcpServer(validated);
      res.status(201).json(mcp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // PUT /api/mcps/:id
  async updateMcp(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const validated = updateMcpSchema.parse(req.body);
      const mcp = mcpService.updateMcpServer(id, validated);

      if (!mcp) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      res.json(mcp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // DELETE /api/mcps/:id
  deleteMcp(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const success = mcpService.deleteMcpServer(id);
      if (!success) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // POST /api/mcps/:id/test
  async testMcp(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const mcp = mcpService.getMcpServerById(id);
      if (!mcp) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      const result = await mcpTestService.testMcpConnection(mcp.connection_config);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

export const mcpController = new McpController();
