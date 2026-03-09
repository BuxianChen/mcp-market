# MCP Servers 开发指南

本目录包含不同类型的 MCP 服务器实现示例。

## 🎯 MCP 协议简介

Model Context Protocol (MCP) 是一个开放协议，用于 AI 应用与外部工具、数据源的标准化通信。

### 核心概念

**Tools（工具）**：可被 AI 调用的函数
- 例如：计算器、天气查询、数据库操作

**Resources（资源）**：可被 AI 读取的数据
- 例如：文件内容、数据库记录、API 响应

**Prompts（提示）**：预定义的提示模板
- 例如：代码审查模板、翻译模板

## 📡 连接类型

### STDIO (Standard Input/Output)
- **特点**：通过标准输入输出通信
- **适用场景**：本地进程、命令行工具
- **优点**：简单、可靠、无需网络
- **示例**：[stdio-server/](./stdio-server/)

### SSE (Server-Sent Events)
- **特点**：基于 HTTP 的单向流式通信
- **适用场景**：Web 应用、实时推送
- **优点**：支持长连接、自动重连
- **示例**：[sse-server/](./sse-server/)

### HTTP API
- **特点**：标准 REST API
- **适用场景**：现有 HTTP 服务、第三方 API
- **优点**：广泛支持、易于集成
- **示例**：[http-api/](./http-api/)

## 🛠️ 开发你的第一个 MCP Server

### Python 示例

```python
from mcp.server import Server
from mcp.types import Tool, TextContent

# 创建服务器
server = Server("my-server")

# 注册工具
@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="add",
            description="Add two numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number"},
                    "b": {"type": "number"}
                },
                "required": ["a", "b"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "add":
        result = arguments["a"] + arguments["b"]
        return [TextContent(type="text", text=str(result))]
    raise ValueError(f"Unknown tool: {name}")

# 启动服务器
if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server

    asyncio.run(stdio_server(server))
```

### Node.js 示例

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 创建服务器
const server = new Server({
  name: "my-server",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// 注册工具
server.setRequestHandler("tools/list", async () => ({
  tools: [{
    name: "add",
    description: "Add two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" }
      },
      required: ["a", "b"]
    }
  }]
}));

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "add") {
    const result = request.params.arguments.a + request.params.arguments.b;
    return {
      content: [{ type: "text", text: String(result) }]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
```

## 📂 目录结构

```
1-mcp-servers/
├── README.md                    # 本文件
├── stdio-server/                # STDIO 服务器示例
│   ├── python/                  # Python 实现
│   │   ├── server.py
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── nodejs/                  # Node.js 实现
│   │   ├── server.js
│   │   ├── package.json
│   │   └── README.md
│   └── README.md
├── sse-server/                  # SSE 服务器示例
│   ├── python/
│   ├── nodejs/
│   └── README.md
└── http-api/                    # HTTP API 示例
    ├── weather-api/
    └── README.md
```

## 🚀 快速开始

### 1. 选择实现语言

**Python**：
```bash
cd stdio-server/python
pip install -r requirements.txt
python server.py
```

**Node.js**：
```bash
cd stdio-server/nodejs
npm install
node server.js
```

### 2. 在 MCP Market 中注册

1. 打开 MCP Market Web 界面
2. 点击"添加 MCP 服务器"
3. 填写配置：
   - 名称：My First Server
   - 类型：STDIO
   - 命令：`python /path/to/server.py`
4. 点击"测试连接"验证

### 3. 测试工具调用

使用"交互式测试"功能：
1. 点击服务器卡片的"交互式测试"按钮
2. 在"工具调用"标签页选择工具
3. 输入参数并执行

## 📖 最佳实践

### 1. 错误处理
```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    try:
        # 工具逻辑
        pass
    except Exception as e:
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]
```

### 2. 参数验证
```python
def validate_arguments(arguments: dict, schema: dict):
    # 使用 jsonschema 验证
    from jsonschema import validate
    validate(instance=arguments, schema=schema)
```

### 3. 日志记录
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    logger.info(f"Calling tool: {name} with {arguments}")
    # ...
```

### 4. 资源管理
```python
# 使用上下文管理器
async with database.connection() as conn:
    result = await conn.execute(query)
```

## 🔗 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 💡 下一步

- 查看 [stdio-server/](./stdio-server/) 完整示例
- 学习 [sse-server/](./sse-server/) 流式通信
- 了解 [http-api/](./http-api/) HTTP 转 MCP
