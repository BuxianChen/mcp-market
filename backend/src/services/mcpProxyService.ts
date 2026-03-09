import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Request, Response } from 'express';
import Database from 'better-sqlite3';
import { join } from 'path';
import type { ConnectionConfig } from '../types/mcp.js';
import type { AuthenticatedRequest } from '../middleware/proxyAuth.js';

const dbPath = join(__dirname, '../../data/mcp-market.db');
const db = new Database(dbPath);

interface ProxySession {
  client: Client;
  transport: SSEClientTransport | StdioClientTransport;
  serverId: number;
  tokenId: number;
  createdAt: Date;
}

export class McpProxyService {
  private sessions: Map<string, ProxySession> = new Map();

  async handleProxyRequest(
    req: AuthenticatedRequest,
    res: Response,
    serverId: number
  ): Promise<void> {
    try {
      if (!req.tokenInfo) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Verify token belongs to this server
      if (req.tokenInfo.server_id !== serverId) {
        res.status(403).json({ error: 'Token not valid for this server' });
        return;
      }

      // Get server config
      const serverStmt = db.prepare('SELECT * FROM mcp_servers WHERE id = ?');
      const server = serverStmt.get(serverId) as any;

      if (!server) {
        res.status(404).json({ error: 'Server not found' });
        return;
      }

      const connectionConfig: ConnectionConfig = JSON.parse(server.connection_config);

      // Create client and connect
      const client = new Client(
        {
          name: 'mcp-market-proxy',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      let transport: SSEClientTransport | StdioClientTransport;

      if (connectionConfig.type === 'sse' || connectionConfig.type === 'http') {
        const url = new URL(connectionConfig.url);
        transport = new SSEClientTransport(url);
      } else if (connectionConfig.type === 'stdio') {
        transport = new StdioClientTransport({
          command: connectionConfig.command,
          args: connectionConfig.args || [],
          env: connectionConfig.env,
        });
      } else {
        res.status(400).json({ error: 'Unsupported connection type' });
        return;
      }

      await client.connect(transport);

      // Store session
      const sessionKey = `${serverId}-${req.tokenInfo.id}`;
      this.sessions.set(sessionKey, {
        client,
        transport,
        serverId,
        tokenId: req.tokenInfo.id,
        createdAt: new Date(),
      });

      // Set up SSE response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send initial connection success
      res.write('data: {"type":"connected"}\n\n');

      // Handle client close
      req.on('close', () => {
        this.closeSession(sessionKey);
      });
    } catch (error) {
      console.error('Proxy request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Proxy failed',
        });
      }
    }
  }

  async callToolViaProxy(
    serverId: number,
    tokenId: number,
    toolName: string,
    args: Record<string, any>
  ): Promise<any> {
    const sessionKey = `${serverId}-${tokenId}`;
    const session = this.sessions.get(sessionKey);

    if (!session) {
      throw new Error('No active proxy session');
    }

    const startTime = Date.now();
    let status = 'success';
    let errorMessage: string | null = null;

    try {
      // Check permissions
      const tokenStmt = db.prepare('SELECT permissions FROM mcp_access_tokens WHERE id = ?');
      const tokenInfo = tokenStmt.get(tokenId) as any;
      const permissions = tokenInfo?.permissions ? JSON.parse(tokenInfo.permissions) : [];

      if (!permissions.includes('tools')) {
        throw new Error('Permission denied: tools access required');
      }

      const result = await session.client.callTool({
        name: toolName,
        arguments: args,
      });

      return result;
    } catch (error) {
      status = 'error';
      errorMessage = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      // Log access
      const duration = Date.now() - startTime;
      this.logAccess(serverId, tokenId, 'call_tool', toolName, null, status, errorMessage, duration);
    }
  }

  private closeSession(sessionKey: string): void {
    const session = this.sessions.get(sessionKey);
    if (session) {
      session.client.close().catch(console.error);
      this.sessions.delete(sessionKey);
    }
  }

  private logAccess(
    serverId: number,
    tokenId: number,
    action: string,
    toolName: string | null,
    resourceUri: string | null,
    status: string,
    errorMessage: string | null,
    durationMs: number
  ): void {
    try {
      const stmt = db.prepare(`
        INSERT INTO mcp_access_logs (server_id, token_id, action, tool_name, resource_uri, status, error_message, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(serverId, tokenId, action, toolName, resourceUri, status, errorMessage, durationMs);
    } catch (error) {
      console.error('Failed to log access:', error);
    }
  }

  destroy(): void {
    for (const sessionKey of this.sessions.keys()) {
      this.closeSession(sessionKey);
    }
  }
}

export const mcpProxyService = new McpProxyService();
