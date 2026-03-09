# Proxy MCP Client - Node.js

通过 MCP Market 代理层连接和使用 MCP 服务器的 Node.js 客户端实现。

## 功能特性

- ✅ 通过 HTTP API 连接 MCP 服务器
- ✅ 获取所有可用服务器列表
- ✅ 获取服务器工具列表
- ✅ 调用工具并获取结果
- ✅ 测试服务器连接
- ✅ 使用原生 fetch API（无需额外依赖）

## 前置条件

确保 MCP Market 后端服务正在运行：

```bash
cd ../../../../backend
npm run dev
```

后端默认运行在 `http://localhost:3000`

## 安装

```bash
npm install
```

## 运行

```bash
npm start
# 或
node proxy_client.js
```

## 代码示例

### 基础使用

```javascript
import { ProxyMCPClient } from "./proxy_client.js";

// 创建客户端
const client = new ProxyMCPClient("http://localhost:3000");

// 获取服务器列表
const servers = await client.listServers();

// 获取工具列表
const tools = await client.listTools(serverId);

// 调用工具
const result = await client.callTool(serverId, "add", { a: 10, b: 20 });
```

### 完整示例

```javascript
import { ProxyMCPClient } from "./proxy_client.js";

async function main() {
  const client = new ProxyMCPClient("http://localhost:3000");

  try {
    // 列出所有服务器
    const servers = await client.listServers();
    for (const server of servers) {
      console.log(`Server: ${server.name} (${server.id})`);
    }

    // 使用第一个服务器
    const serverId = servers[0].id;

    // 测试连接
    const testResult = await client.testConnection(serverId);
    console.log(`Connection test: ${testResult}`);

    // 获取工具
    const tools = await client.listTools(serverId);
    for (const tool of tools) {
      console.log(`Tool: ${tool.name}`);
    }

    // 调用��具
    const result = await client.callTool(
      serverId,
      "get_weather",
      { city: "Beijing" }
    );
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);

  } catch (error) {
    console.error("Error:", error);
  }
}

main();
```

## 客户端 API

### ProxyMCPClient

#### `constructor(proxyUrl = "http://localhost:3000")`

创建代理客户端实例。

**参数**:
- `proxyUrl` (string): MCP Market 代理服务器地址

#### `async listServers(): Promise<Array>`

获取所有可用的 MCP 服务器。

**返回**:
```javascript
[
  {
    id: "server-id",
    name: "Server Name",
    type: "stdio|sse|http",
    status: "connected|disconnected"
  },
  ...
]
```

#### `async getServerInfo(serverId): Promise<Object>`

获取服务器详细信息。

**参数**:
- `serverId` (string): 服务器 ID

**返回**:
```javascript
{
  id: "server-id",
  name: "Server Name",
  type: "stdio",
  config: {...},
  status: "connected"
}
```

#### `async listTools(serverId): Promise<Array>`

获取指定服务器的工具列表。

**参数**:
- `serverId` (string): 服务器 ID

**返回**:
```javascript
[
  {
    name: "tool_name",
    description: "Tool description",
    inputSchema: {...}
  },
  ...
]
```

#### `async callTool(serverId, toolName, arguments): Promise<any>`

调用工具。

**参数**:
- `serverId` (string): 服务器 ID
- `toolName` (string): 工具名称
- `arguments` (Object): 工具参数

**返回**:
- 工具执行结果

#### `async testConnection(serverId): Promise<Object>`

测试服务器连接。

**参数**:
- `serverId` (string): 服务器 ID

**返回**:
```javascript
{
  success: true,
  message: "Connection successful"
}
```

## 代理层优势

### vs 直接连接

**代理层优势**:
- ✅ 统一管理多个 MCP 服务器
- ✅ 集中式监控和日志
- ✅ 支持 HTTP 转 MCP
- ✅ 简化客户端实现
- ✅ 支持负载均衡

**直接连接优势**:
- ✅ 更低延迟
- ✅ 适合本地开发

## 错误处理

```javascript
try {
  const result = await client.callTool(serverId, "add", { a: 10, b: 20 });
} catch (error) {
  if (error.message.includes("HTTP")) {
    console.error("HTTP Error:", error.message);
  } else {
    console.error("Unexpected Error:", error);
  }
}
```

## 高级用法

### 添加认证

```javascript
class AuthProxyMCPClient extends ProxyMCPClient {
  constructor(proxyUrl, apiKey) {
    super(proxyUrl);
    this.apiKey = apiKey;
  }

  async callTool(serverId, toolName, arguments) {
    const response = await fetch(`${this.proxyUrl}/api/mcp/call-tool`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ serverId, toolName, arguments })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  }
}
```

### 批量调用

```javascript
async function batchCallTools(client, serverId, calls) {
  const promises = calls.map(call =>
    client.callTool(serverId, call.name, call.arguments)
      .catch(error => ({ error: error.message }))
  );
  return await Promise.all(promises);
}

// 使用
const calls = [
  { name: "add", arguments: { a: 1, b: 2 } },
  { name: "multiply", arguments: { a: 3, b: 4 } },
];
const results = await batchCallTools(client, serverId, calls);
```

### 重试机制

```javascript
async function callToolWithRetry(client, serverId, toolName, arguments, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.callTool(serverId, toolName, arguments);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### 结果缓存

```javascript
import crypto from "crypto";

class CachedProxyMCPClient extends ProxyMCPClient {
  constructor(...args) {
    super(...args);
    this._cache = new Map();
  }

  _cacheKey(serverId, toolName, arguments) {
    const keyStr = `${serverId}:${toolName}:${JSON.stringify(arguments)}`;
    return crypto.createHash("md5").update(keyStr).digest("hex");
  }

  async callTool(serverId, toolName, arguments) {
    const cacheKey = this._cacheKey(serverId, toolName, arguments);
    if (this._cache.has(cacheKey)) {
      console.log("✓ Using cached result");
      return this._cache.get(cacheKey);
    }

    const result = await super.callTool(serverId, toolName, arguments);
    this._cache.set(cacheKey, result);
    return result;
  }
}
```

## 与 Web 应用集成

### Express 示例

```javascript
import express from "express";
import { ProxyMCPClient } from "./proxy_client.js";

const app = express();
const client = new ProxyMCPClient("http://localhost:3000");

app.use(express.json());

app.get("/api/tools/:serverId", async (req, res) => {
  try {
    const tools = await client.listTools(req.params.serverId);
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/call-tool", async (req, res) => {
  try {
    const { serverId, toolName, arguments } = req.body;
    const result = await client.callTool(serverId, toolName, arguments);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
```

### Next.js API Route 示例

```javascript
// pages/api/tools/[serverId].js
import { ProxyMCPClient } from "@/lib/proxy_client";

const client = new ProxyMCPClient("http://localhost:3000");

export default async function handler(req, res) {
  const { serverId } = req.query;

  try {
    const tools = await client.listTools(serverId);
    res.status(200).json(tools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## TypeScript 支持

```typescript
interface Server {
  id: string;
  name: string;
  type: "stdio" | "sse" | "http";
  status?: string;
}

interface Tool {
  name: string;
  description?: string;
  inputSchema: object;
}

class ProxyMCPClient {
  constructor(private proxyUrl: string = "http://localhost:3000") {}

  async listServers(): Promise<Server[]> {
    // ...
  }

  async listTools(serverId: string): Promise<Tool[]> {
    // ...
  }

  async callTool(serverId: string, toolName: string, arguments: any): Promise<any> {
    // ...
  }
}
```

## 相关资源

- [MCP Market 后端 API](../../../../backend/README.md)
- [直接连接客户端](../../nodejs-client/)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [返回上级目录](../)
