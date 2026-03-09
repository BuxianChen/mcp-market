# MCP Client 示例

本目录包含各种 MCP 客户端的实现示例，展示如何连接和使用 MCP 服务器。

## 📚 示例列表

### 基础客户端
- [Python Client](./python-client/) - Python 实现的基础 MCP 客户端
- [Node.js Client](./nodejs-client/) - Node.js 实现的基础 MCP 客户端

### 代理客户端
- [Proxy Client - Python](./proxy-client/python/) - 通过 MCP Market 代理层连接
- [Proxy Client - Node.js](./proxy-client/nodejs/) - 通过 MCP Market 代理层连接

## 🎯 快速开始

### 直接连接 MCP Server

适用于本地开发和测试：

```python
# Python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async with stdio_client(
    StdioServerParameters(command="python", args=["server.py"])
) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        tools = await session.list_tools()
```

```javascript
// Node.js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "python",
  args: ["server.py"]
});

const client = new Client({ name: "example-client", version: "1.0.0" }, {});
await client.connect(transport);
```

### 通过代理层连接

适用于生产环境，统一管理多个 MCP 服务器：

```python
# Python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:3000/api/mcp/call-tool",
        json={
            "serverId": "server-id",
            "toolName": "get_weather",
            "arguments": {"city": "beijing"}
        }
    )
    result = response.json()
```

```javascript
// Node.js
const response = await fetch("http://localhost:3000/api/mcp/call-tool", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    serverId: "server-id",
    toolName: "get_weather",
    arguments: { city: "beijing" }
  })
});
const result = await response.json();
```

## 🔄 连接方式对比

### 直接连接

**优势**:
- ✅ 低延迟，直接通信
- ✅ 适合本地开发和测试
- ✅ 完整的 MCP 协议支持

**劣势**:
- ❌ 需要管理多个连接
- ❌ 缺少统一的监控和日志
- ❌ 难以实现负载均衡

### 代理层连接

**优势**:
- ✅ 统一管理多个 MCP 服务器
- ✅ 集中式监控和日志
- ✅ 支持负载均衡和故障转移
- ✅ 简化客户端实现
- ✅ 支持 HTTP 转 MCP

**劣势**:
- ❌ 增加一层网络延迟
- ❌ 需要部署代理服务

## 📖 使用场景

### 场景 1: 本地开发

使用直接连接方式，快速测试 MCP 服务器：

```bash
cd python-client
python basic_client.py
```

### 场景 2: 生产环境

使用代理层，统一管理和监控：

```bash
cd proxy-client/python
python proxy_client.py
```

### 场景 3: Web 应用

通过 HTTP API 调用 MCP 工具：

```javascript
// 前端代码
async function callMCPTool(serverId, toolName, args) {
  const response = await fetch("/api/mcp/call-tool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serverId, toolName, arguments: args })
  });
  return await response.json();
}
```

## 🛠️ 客户端功能

### 基础功能

所有客户端都支持：

1. **连接管理**: 建立和维护与 MCP 服务器的连接
2. **工具列表**: 获取服务器提供的所有工具
3. **工具调用**: 执行特定工具并获取结果
4. **错误处理**: 处理连接错误和工具执行错误

### 高级功能

代理客户端额外支持：

1. **服务器发现**: 自动发现可用的 MCP 服务器
2. **负载均衡**: 在多个服务器实例间分配请求
3. **缓存**: 缓存工具列表和常用结果
4. **监控**: 记录调用日志和性能指标

## 📝 开发指南

### 创建自定义客户端

1. 选择连接方式（直接 or 代理）
2. 实现连接逻辑
3. 处理工具列表和调用
4. 添加错误处理和重试
5. 实现日志和监控

### Python 客户端模板

```python
from mcp import ClientSession
from mcp.client.stdio import stdio_client

class MCPClient:
    def __init__(self, server_command, server_args):
        self.server_command = server_command
        self.server_args = server_args
        self.session = None

    async def connect(self):
        """连接到 MCP 服务器"""
        # 实现连接逻辑
        pass

    async def list_tools(self):
        """获取工具列表"""
        # 实现工具列表获取
        pass

    async def call_tool(self, name, arguments):
        """调用工具"""
        # 实现工具调用
        pass

    async def disconnect(self):
        """断开连接"""
        # 实现断开逻辑
        pass
```

### Node.js 客户端模板

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

class MCPClient {
  constructor(serverCommand, serverArgs) {
    this.serverCommand = serverCommand;
    this.serverArgs = serverArgs;
    this.client = null;
  }

  async connect() {
    // 实现连接逻辑
  }

  async listTools() {
    // 实现工具列表获取
  }

  async callTool(name, arguments) {
    // 实现工具调用
  }

  async disconnect() {
    // 实现断开逻辑
  }
}
```

## 🔗 相关资源

- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [MCP Market 代理 API](../../docs/api.md)

## 💡 下一步

1. 查看具体的客户端实现示例
2. 运行示例代码
3. 根据需求选择合适的连接方式
4. 开发自己的 MCP 客户端应用
