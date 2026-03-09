/**
 * Basic MCP Client - Node.js 实现
 *
 * 这是一个基础的 MCP 客户端示例，展示如何连接 MCP 服务器并调用工具。
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class BasicMCPClient {
  /**
   * 初始化客户端
   *
   * @param {string} serverCommand - 服务器启动命令（如 "python"）
   * @param {string[]} serverArgs - 服务器启动参数（如 ["server.py"]）
   */
  constructor(serverCommand, serverArgs) {
    this.serverCommand = serverCommand;
    this.serverArgs = serverArgs;
    this.client = null;
    this.transport = null;
  }

  /**
   * 连接到 MCP 服务器
   */
  async connect() {
    console.log(`Connecting to MCP server: ${this.serverCommand} ${this.serverArgs.join(' ')}`);

    // 创建 STDIO 传输层
    this.transport = new StdioClientTransport({
      command: this.serverCommand,
      args: this.serverArgs
    });

    // 创建客户端
    this.client = new Client(
      {
        name: "basic-mcp-client",
        version: "1.0.0"
      },
      {
        capabilities: {}
      }
    );

    // 连接
    await this.client.connect(this.transport);
    console.log("✓ Connected to MCP server");
  }

  /**
   * 获取服务器提供的所有工具
   *
   * @returns {Promise<Array>} 工具列表
   */
  async listTools() {
    if (!this.client) {
      throw new Error("Not connected to server");
    }

    console.log("\nFetching tool list...");
    const result = await this.client.listTools();

    const tools = result.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));

    console.log(`✓ Found ${tools.length} tools`);
    return tools;
  }

  /**
   * 调用工具
   *
   * @param {string} name - 工具名称
   * @param {Object} arguments - 工具参数
   * @returns {Promise<any>} 工具执行结果
   */
  async callTool(name, arguments) {
    if (!this.client) {
      throw new Error("Not connected to server");
    }

    console.log(`\nCalling tool: ${name}`);
    console.log(`Arguments: ${JSON.stringify(arguments, null, 2)}`);

    const result = await this.client.callTool({
      name,
      arguments
    });

    console.log("✓ Tool executed successfully");
    return result;
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log("\n✓ Disconnected from MCP server");
    }
  }
}

/**
 * 主函数 - 演示客户端使用
 */
async function main() {
  // 创建客户端（连接到 STDIO 服务器）
  const client = new BasicMCPClient(
    "python",
    ["../../1-mcp-servers/stdio-server/python/server.py"]
  );

  try {
    // 1. 连接到服务器
    await client.connect();

    // 2. 获取工具列表
    const tools = await client.listTools();
    console.log("\n" + "=".repeat(50));
    console.log("Available Tools:");
    console.log("=".repeat(50));
    for (const tool of tools) {
      console.log(`\n• ${tool.name}`);
      console.log(`  ${tool.description}`);
    }

    // 3. 调用工具示例
    console.log("\n" + "=".repeat(50));
    console.log("Tool Call Examples:");
    console.log("=".repeat(50));

    // 示例 1: 计算器
    let result = await client.callTool("add", { a: 10, b: 20 });
    console.log(`Result: ${result.content[0].text}`);

    // 示例 2: 天气查询
    result = await client.callTool("get_weather", { city: "Beijing" });
    console.log(`Result: ${result.content[0].text}`);

    // 示例 3: 文本处理
    result = await client.callTool("to_upper_case", { text: "hello world" });
    console.log(`Result: ${result.content[0].text}`);

    // 示例 4: 单词计数
    result = await client.callTool("word_count", { text: "The quick brown fox" });
    console.log(`Result: ${result.content[0].text}`);

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    console.error(error.stack);
  } finally {
    // 4. 断开连接
    await client.disconnect();
  }
}

// 运行主函数
console.log("=".repeat(50));
console.log("Basic MCP Client Example");
console.log("=".repeat(50));
main().catch(console.error);

export { BasicMCPClient };
