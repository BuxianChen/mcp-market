import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { ConnectionConfig, McpTestResult } from '../types/mcp';

export class McpTestService {
  async testMcpConnection(config: ConnectionConfig): Promise<McpTestResult> {
    let client: Client | null = null;

    try {
      client = new Client({
        name: 'mcp-market-tester',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // 根据连接类型创建 transport
      let transport;

      if (config.type === 'sse') {
        transport = new SSEClientTransport(new URL(config.url));
      } else if (config.type === 'stdio') {
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args || [],
          env: config.env
        });
      } else {
        // HTTP 类型暂时使用 SSE transport（MCP SDK 主要支持 SSE 和 stdio）
        transport = new SSEClientTransport(new URL(config.url));
      }

      // 设置超时
      const timeout = config.type !== 'stdio' && 'timeout' in config ? config.timeout || 10000 : 10000;
      const connectPromise = client.connect(transport);

      await Promise.race([
        connectPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), timeout)
        )
      ]);

      // 获取服务器信息
      const serverInfo = await client.getServerVersion();

      // 获取能力
      const capabilities: McpTestResult['capabilities'] = {};

      try {
        const tools = await client.listTools();
        capabilities.tools = tools.tools.map(tool => ({
          name: tool.name,
          description: tool.description
        }));
      } catch (e) {
        // 如果不支持 tools，忽略错误
      }

      try {
        const resources = await client.listResources();
        capabilities.resources = resources.resources.map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description
        }));
      } catch (e) {
        // 如果不支持 resources，忽略错误
      }

      try {
        const prompts = await client.listPrompts();
        capabilities.prompts = prompts.prompts.map(prompt => ({
          name: prompt.name,
          description: prompt.description
        }));
      } catch (e) {
        // 如果不支持 prompts，忽略错误
      }

      await client.close();

      return {
        success: true,
        message: 'Connection successful',
        serverInfo: {
          name: serverInfo.name,
          version: serverInfo.version,
          protocolVersion: serverInfo.protocolVersion
        },
        capabilities
      };
    } catch (error) {
      if (client) {
        try {
          await client.close();
        } catch (e) {
          // 忽略关闭错误
        }
      }

      return {
        success: false,
        message: 'Connection failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export const mcpTestService = new McpTestService();
