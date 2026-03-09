# Node.js MCP Client

基础的 Node.js MCP 客户端实现，展示如何连接和使用 MCP 服务器。

## 功能特性

- ✅ 连接到 STDIO MCP 服务器
- ✅ 获取服务器工具列表
- ✅ 调用工具并获取结果
- ✅ 完整的错误处理
- ✅ ES Module 支持

## 安装

```bash
npm install
```

## 运行

```bash
npm start
# 或
node basic_client.js
```

## 代码示例

### 基础使用

```javascript
import { BasicMCPClient } from "./basic_client.js";

// 创建客户端
const client = new BasicMCPClient(
  "python",
  ["server.py"]
);

// 连接
await client.connect();

// 获取工具列表
const tools = await client.listTools();

// 调用工具
const result = await client.callTool("add", { a: 10, b: 20 });

// 断开连接
await client.disconnect();
```

### 完整示例

```javascript
import { BasicMCPClient } from "./basic_client.js";

async function main() {
  const client = new BasicMCPClient(
    "python",
    ["../../1-mcp-servers/stdio-server/python/server.py"]
  );

  try {
    // 连接
    await client.connect();

    // 列出工具
    const tools = await client.listTools();
    for (const tool of tools) {
      console.log(`Tool: ${tool.name} - ${tool.description}`);
    }

    // 调用工具
    const result = await client.callTool("get_weather", { city: "Beijing" });
    console.log(`Result: ${result.content[0].text}`);

  } finally {
    await client.disconnect();
  }
}

main().catch(console.error);
```

## 客户端 API

### BasicMCPClient

#### `constructor(serverCommand, serverArgs)`

创建客户端实例。

**参数**:
- `serverCommand` (string): 服务器启动命令（如 "python"）
- `serverArgs` (string[]): 服务器启动参数（如 ["server.py"]）

#### `async connect()`

连接到 MCP 服务器并初始化会话。

**异常**:
- `Error`: 连接失败时抛出

#### `async listTools(): Promise<Array>`

获取服务器提供的所有工具。

**返回**:
- `Array`: 工具列表，每个工具包含 name, description, inputSchema

**示例**:
```javascript
const tools = await client.listTools();
// [
//   {
//     name: "add",
//     description: "两数相加",
//     inputSchema: {...}
//   },
//   ...
// ]
```

#### `async callTool(name, arguments): Promise<any>`

调用指定的工具。

**参数**:
- `name` (string): 工具名称
- `arguments` (Object): 工具参数

**返回**:
- 工具执行结果

**示例**:
```javascript
const result = await client.callTool("add", { a: 10, b: 20 });
console.log(result.content[0].text);  // "30"
```

#### `async disconnect()`

断开与服务器的连接。

## 连接不同类型的服务器

### STDIO 服务器

```javascript
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "python",
  args: ["server.py"]
});

await client.connect(transport);
```

### SSE 服务器

```javascript
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("http://localhost:3001/mcp")
);

await client.connect(transport);
```

## 错误处理

```javascript
try {
  await client.connect();
  const result = await client.callTool("add", { a: 10, b: 20 });
} catch (error) {
  if (error.message.includes("Not connected")) {
    console.error("Connection error:", error);
  } else {
    console.error("Tool call error:", error);
  }
} finally {
  await client.disconnect();
}
```

## 高级用法

### 自定义客户端

```javascript
class CustomMCPClient extends BasicMCPClient {
  async callToolWithRetry(name, arguments, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.callTool(name, arguments);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        console.log(`Retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}
```

### 批量调用

```javascript
async function batchCallTools(client, calls) {
  const promises = calls.map(call =>
    client.callTool(call.name, call.arguments)
      .catch(error => ({ error: error.message }))
  );
  return await Promise.all(promises);
}

// 使用
const calls = [
  { name: "add", arguments: { a: 1, b: 2 } },
  { name: "multiply", arguments: { a: 3, b: 4 } },
];
const results = await batchCallTools(client, calls);
```

### 工具缓存

```javascript
class CachedMCPClient extends BasicMCPClient {
  constructor(...args) {
    super(...args);
    this._toolsCache = null;
  }

  async listTools() {
    if (this._toolsCache === null) {
      this._toolsCache = await super.listTools();
    }
    return this._toolsCache;
  }
}
```

## 性能优化

### 连接池

```javascript
class MCPClientPool {
  constructor(size = 5) {
    this.size = size;
    this.clients = [];
    this.currentIndex = 0;
  }

  async initialize(serverCommand, serverArgs) {
    for (let i = 0; i < this.size; i++) {
      const client = new BasicMCPClient(serverCommand, serverArgs);
      await client.connect();
      this.clients.push(client);
    }
  }

  async callTool(name, arguments) {
    const client = this.clients[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.size;
    return await client.callTool(name, arguments);
  }

  async close() {
    await Promise.all(this.clients.map(c => c.disconnect()));
  }
}
```

## 调试

启用详细日志：

```javascript
// 设置环境变量
process.env.DEBUG = "mcp:*";

// 或在代码中
import debug from "debug";
const log = debug("mcp:client");
log("Debug message");
```

## TypeScript 支持

如果使用 TypeScript：

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

class BasicMCPClient {
  private client: Client | null = null;

  async listTools(): Promise<Tool[]> {
    // ...
  }
}
```

## 相关资源

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [STDIO 服务器示例](../../1-mcp-servers/stdio-server/)
- [返回上级目录](../)
