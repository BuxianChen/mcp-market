import { Request, Response } from 'express';
import { mcpService } from '../services/mcpService';
import { mcpTestService } from '../services/mcpTestService';
import { mcpSessionService } from '../services/mcpSessionService';
import { httpToMcpAdapter } from '../services/httpToMcpAdapter';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { join } from 'path';
import { randomBytes } from 'crypto';

const dbPath = join(__dirname, '../../data/mcp-market.db');
const db = new Database(dbPath);

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

  // POST /api/mcps/:id/sessions - Create a session
  async createSession(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const mcp = mcpService.getMcpServerById(id);
      if (!mcp) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      const sessionId = await mcpSessionService.createSession(id, mcp.connection_config);
      const sessionInfo = mcpSessionService.getSessionInfo(sessionId);

      res.status(201).json(sessionInfo);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // DELETE /api/mcps/:id/sessions/:sessionId - Close a session
  async closeSession(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId;

      await mcpSessionService.closeSession(sessionId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // POST /api/mcps/:id/sessions/:sessionId/call-tool - Call a tool
  async callTool(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId;
      const { toolName, arguments: args } = req.body;

      if (!toolName) {
        return res.status(400).json({ error: 'toolName is required' });
      }

      const result = await mcpSessionService.callTool(sessionId, toolName, args || {});
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // GET /api/mcps/:id/sessions/:sessionId/resources - List resources
  async listResources(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId;

      const resources = await mcpSessionService.listResources(sessionId);
      res.json({ resources });
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // GET /api/mcps/:id/sessions/:sessionId/resources/read - Read a resource
  async readResource(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId;
      const uri = req.query.uri as string;

      if (!uri) {
        return res.status(400).json({ error: 'uri query parameter is required' });
      }

      const result = await mcpSessionService.readResource(sessionId, uri);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // GET /api/mcps/:id/sessions/:sessionId/prompts - List prompts
  async listPrompts(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId;

      const prompts = await mcpSessionService.listPrompts(sessionId);
      res.json({ prompts });
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // POST /api/mcps/:id/sessions/:sessionId/prompts/:promptName - Get a prompt
  async getPrompt(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId;
      const promptName = req.params.promptName;
      const args = req.body.arguments;

      const result = await mcpSessionService.getPrompt(sessionId, promptName, args);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Session not found') {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // POST /api/mcps/:id/tokens - Create access token
  async createToken(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const mcp = mcpService.getMcpServerById(id);
      if (!mcp) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      const { name, permissions, expiresAt } = req.body;

      // Generate random token
      const token = randomBytes(32).toString('hex');

      // Insert token
      const stmt = db.prepare(`
        INSERT INTO mcp_access_tokens (token, server_id, name, permissions, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        token,
        id,
        name || null,
        JSON.stringify(permissions || ['tools', 'resources', 'prompts']),
        expiresAt || null
      );

      // Get created token
      const getStmt = db.prepare('SELECT * FROM mcp_access_tokens WHERE id = ?');
      const createdToken = getStmt.get(result.lastInsertRowid) as any;

      res.status(201).json({
        ...createdToken,
        permissions: JSON.parse(createdToken.permissions),
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // GET /api/mcps/:id/tokens - List tokens
  async listTokens(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const stmt = db.prepare('SELECT * FROM mcp_access_tokens WHERE server_id = ? ORDER BY created_at DESC');
      const tokens = stmt.all(id) as any[];

      res.json(
        tokens.map((token) => ({
          ...token,
          permissions: JSON.parse(token.permissions),
        }))
      );
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // DELETE /api/mcps/:id/tokens/:tokenId - Delete token
  async deleteToken(req: Request, res: Response) {
    try {
      const tokenId = parseInt(req.params.tokenId);
      if (isNaN(tokenId)) {
        return res.status(400).json({ error: 'Invalid token ID' });
      }

      const stmt = db.prepare('DELETE FROM mcp_access_tokens WHERE id = ?');
      const result = stmt.run(tokenId);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // GET /api/mcps/:id/logs - Get access logs
  async getAccessLogs(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const stmt = db.prepare(`
        SELECT * FROM mcp_access_logs
        WHERE server_id = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `);

      const logs = stmt.all(id, limit, offset);

      res.json({ logs });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // POST /api/mcps/:id/http-mappings - Create HTTP to MCP mapping
  async createHttpMapping(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const mcp = mcpService.getMcpServerById(id);
      if (!mcp) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      const { toolName, toolDescription, httpMethod, httpUrl, httpHeaders, inputSchema, responseMapping } = req.body;

      const mapping = httpToMcpAdapter.createMapping({
        serverId: id,
        toolName,
        toolDescription,
        httpMethod,
        httpUrl,
        httpHeaders,
        inputSchema,
        responseMapping,
      });

      res.status(201).json(mapping);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // GET /api/mcps/:id/http-mappings - List HTTP to MCP mappings
  async listHttpMappings(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const mappings = httpToMcpAdapter.getMappings(id);
      res.json({ mappings });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // PUT /api/mcps/:id/http-mappings/:mappingId - Update HTTP to MCP mapping
  async updateHttpMapping(req: Request, res: Response) {
    try {
      const mappingId = parseInt(req.params.mappingId);
      if (isNaN(mappingId)) {
        return res.status(400).json({ error: 'Invalid mapping ID' });
      }

      const { toolName, toolDescription, httpMethod, httpUrl, httpHeaders, inputSchema, responseMapping } = req.body;

      httpToMcpAdapter.updateMapping(mappingId, {
        toolName,
        toolDescription,
        httpMethod,
        httpUrl,
        httpHeaders,
        inputSchema,
        responseMapping,
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // DELETE /api/mcps/:id/http-mappings/:mappingId - Delete HTTP to MCP mapping
  async deleteHttpMapping(req: Request, res: Response) {
    try {
      const mappingId = parseInt(req.params.mappingId);
      if (isNaN(mappingId)) {
        return res.status(400).json({ error: 'Invalid mapping ID' });
      }

      httpToMcpAdapter.deleteMapping(mappingId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

export const mcpController = new McpController();
