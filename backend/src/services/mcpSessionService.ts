import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { randomUUID } from 'crypto';
import type { ConnectionConfig, HttpConfig, SseConfig, StdioConfig } from '../types/mcp.js';

interface Session {
  id: string;
  serverId: number;
  client: Client;
  transport: SSEClientTransport | StdioClientTransport | StreamableHTTPClientTransport;
  createdAt: Date;
  lastActivityAt: Date;
}

interface ToolCallResult {
  success: boolean;
  content?: any;
  error?: string;
}

interface ResourceReadResult {
  success: boolean;
  contents?: any[];
  error?: string;
}

interface PromptGetResult {
  success: boolean;
  messages?: any[];
  error?: string;
}

export class McpSessionService {
  private sessions: Map<string, Session> = new Map();
  private readonly MAX_SESSIONS_PER_SERVER = 5;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  async createSession(serverId: number, connectionConfig: ConnectionConfig): Promise<string> {
    // Check session limit per server
    const serverSessions = Array.from(this.sessions.values()).filter(
      (s) => s.serverId === serverId
    );
    if (serverSessions.length >= this.MAX_SESSIONS_PER_SERVER) {
      throw new Error(`Maximum ${this.MAX_SESSIONS_PER_SERVER} sessions per server reached`);
    }

    const sessionId = randomUUID();
    const client = new Client(
      {
        name: 'mcp-market-session',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    let transport: SSEClientTransport | StdioClientTransport | StreamableHTTPClientTransport;

    try {
      if (connectionConfig.type === 'sse') {
        const config = connectionConfig as SseConfig;
        const url = new URL(config.url);
        transport = new SSEClientTransport(url);
      } else if (connectionConfig.type === 'http') {
        const config = connectionConfig as HttpConfig;
        const url = new URL(config.url);
        transport = new StreamableHTTPClientTransport(url);
      } else if (connectionConfig.type === 'stdio') {
        const config = connectionConfig as StdioConfig;
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args || [],
          env: config.env,
        });
      } else {
        throw new Error(`Unsupported connection type: ${(connectionConfig as any).type}`);
      }

      await client.connect(transport);

      const session: Session = {
        id: sessionId,
        serverId,
        client,
        transport,
        createdAt: new Date(),
        lastActivityAt: new Date(),
      };

      this.sessions.set(sessionId, session);
      return sessionId;
    } catch (error) {
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      await session.client.close();
    } catch (error) {
      console.error('Error closing client:', error);
    }

    this.sessions.delete(sessionId);
  }

  async callTool(sessionId: string, toolName: string, args: Record<string, any>): Promise<ToolCallResult> {
    const session = this.getSession(sessionId);

    try {
      const result = await session.client.callTool({
        name: toolName,
        arguments: args,
      });

      session.lastActivityAt = new Date();

      return {
        success: true,
        content: result.content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async listResources(sessionId: string): Promise<any[]> {
    const session = this.getSession(sessionId);

    try {
      const result = await session.client.listResources();
      session.lastActivityAt = new Date();
      return result.resources || [];
    } catch (error) {
      throw new Error(`Failed to list resources: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async readResource(sessionId: string, uri: string): Promise<ResourceReadResult> {
    const session = this.getSession(sessionId);

    try {
      const result = await session.client.readResource({ uri });
      session.lastActivityAt = new Date();

      return {
        success: true,
        contents: result.contents,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async listPrompts(sessionId: string): Promise<any[]> {
    const session = this.getSession(sessionId);

    try {
      const result = await session.client.listPrompts();
      session.lastActivityAt = new Date();
      return result.prompts || [];
    } catch (error) {
      throw new Error(`Failed to list prompts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPrompt(sessionId: string, promptName: string, args?: Record<string, any>): Promise<PromptGetResult> {
    const session = this.getSession(sessionId);

    try {
      const result = await session.client.getPrompt({
        name: promptName,
        arguments: args,
      });

      session.lastActivityAt = new Date();

      return {
        success: true,
        messages: result.messages,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getSessionInfo(sessionId: string): { id: string; serverId: number; createdAt: Date; lastActivityAt: Date } {
    const session = this.getSession(sessionId);
    return {
      id: session.id,
      serverId: session.serverId,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
    };
  }

  private getSession(sessionId: string): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt.getTime() > this.SESSION_TIMEOUT_MS) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      console.log(`Cleaning up expired session: ${sessionId}`);
      this.closeSession(sessionId).catch((error) => {
        console.error(`Error closing expired session ${sessionId}:`, error);
      });
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId).catch((error) => {
        console.error(`Error closing session ${sessionId}:`, error);
      });
    }
  }
}

// Singleton instance
export const mcpSessionService = new McpSessionService();
