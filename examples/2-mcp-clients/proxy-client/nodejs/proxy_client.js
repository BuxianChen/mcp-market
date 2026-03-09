/**
 * Proxy MCP Client - Node.js 实现
 *
 * 通过 MCP Market 代理层连接和使用 MCP 服务器。
 * 适用于生产环境，提供统一的服务器管理和监控。
 */

class ProxyMCPClient {
  /**
   * 初始化代理客户端
   *
   * @param {string} proxyUrl - MCP Market 代理服务器地址
   */
  constructor(proxyUrl = "http://localhost:3000") {
    this.proxyUrl = proxyUrl.replace(/\/$/, "");
  }

  /**
   * 获取所有可用的 MCP 服务器
   *
   * @returns {Promise<Array>} 服务器列表
   */
  async listServers() {
    console.log("Fetching server list...");
    const response = await fetch(`${this.proxyUrl}/api/mcp/servers`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const servers = await response.json();
    console.log(`✓ Found ${servers.length} servers`);
    return servers;
  }

  /**
   * 获取服务器详细信息
   *
   * @param {string} serverId - 服务器 ID
   * @returns {Promise<Object>} 服务器信息
   */
  async getServerInfo(serverId) {
    const response = await fetch(
      `${this.proxyUrl}/api/mcp/servers/${serverId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * 获取指定服务器的工具列表
   *
   * @param {string} serverId - 服务器 ID
   * @returns {Promise<Array>} 工具列表
   */
  async listTools(serverId) {
    console.log(`\nFetching tools for server: ${serverId}`);
    const response = await fetch(
      `${this.proxyUrl}/api/mcp/servers/${serverId}/tools`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const tools = await response.json();
    console.log(`✓ Found ${tools.length} tools`);
    return tools;
  }

  /**
   * 调用工具
   *
   * @param {string} serverId - 服务器 ID
   * @param {string} toolName - 工具名称
   * @param {Object} arguments - 工具参数
   * @returns {Promise<any>} 工具执行结果
   */
  async callTool(serverId, toolName, arguments) {
    console.log(`\nCalling tool: ${toolName} on server: ${serverId}`);
    console.log(`Arguments: ${JSON.stringify(arguments, null, 2)}`);

    const response = await fetch(`${this.proxyUrl}/api/mcp/call-tool`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        serverId,
        toolName,
        arguments
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log("✓ Tool executed successfully");
    return result;
  }

  /**
   * 测试服务器连接
   *
   * @param {string} serverId - 服务器 ID
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection(serverId) {
    console.log(`\nTesting connection to server: ${serverId}`);
    const response = await fetch(
      `${this.proxyUrl}/api/mcp/servers/${serverId}/test`,
      { method: "POST" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    if (result.success) {
      console.log("✓ Connection test passed");
    } else {
      console.log(`✗ Connection test failed: ${result.error}`);
    }
    return result;
  }
}

/**
 * 主函数 - 演示代理客户端使用
 */
async function main() {
  // 创建代理客户端
  const client = new ProxyMCPClient("http://localhost:3000");

  try {
    // 1. 获取服务器列表
    console.log("=".repeat(50));
    console.log("Available MCP Servers:");
    console.log("=".repeat(50));

    const servers = await client.listServers();
    for (const server of servers) {
      console.log(`\n• ${server.name} (ID: ${server.id})`);
      console.log(`  Type: ${server.type}`);
      console.log(`  Status: ${server.status || "unknown"}`);
    }

    if (servers.length === 0) {
      console.log("\n⚠ No servers available. Please add a server first.");
      return;
    }

    // 使用第一个服务器进行演示
    const serverId = servers[0].id;
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Using server: ${servers[0].name}`);
    console.log("=".repeat(50));

    // 2. 测试连接
    await client.testConnection(serverId);

    // 3. 获取工具列表
    const tools = await client.listTools(serverId);
    console.log("\n" + "=".repeat(50));
    console.log("Available Tools:");
    console.log("=".repeat(50));
    for (const tool of tools) {
      console.log(`\n• ${tool.name}`);
      console.log(`  ${tool.description || "No description"}`);
    }

    // 4. 调用工具示例
    console.log("\n" + "=".repeat(50));
    console.log("Tool Call Examples:");
    console.log("=".repeat(50));

    // 根据可用工具调用示例
    if (tools.some(t => t.name === "add")) {
      const result = await client.callTool(serverId, "add", { a: 10, b: 20 });
      console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    }

    if (tools.some(t => t.name === "get_weather")) {
      const result = await client.callTool(serverId, "get_weather", {
        city: "Beijing"
      });
      console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    }

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    console.error(error.stack);
  }
}

// 运行主函数
console.log("=".repeat(50));
console.log("Proxy MCP Client Example");
console.log("=".repeat(50));
console.log("\n⚠ Make sure MCP Market backend is running on http://localhost:3000\n");
main().catch(console.error);

export { ProxyMCPClient };
