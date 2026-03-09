# Python MCP Client

基础的 Python MCP 客户端实现，展示如何连接和使用 MCP 服务器。

## 功能特性

- ✅ 连接到 STDIO MCP 服务器
- ✅ 获取服务器工具列表
- ✅ 调用工具并获取结果
- ✅ 完整的错误处理
- ✅ 异步 I/O 支持

## 安装

```bash
pip install -r requirements.txt
```

## 运行

```bash
python basic_client.py
```

## 代码示例

### 基础使用

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# 创建客户端
client = BasicMCPClient(
    server_command="python",
    server_args=["server.py"]
)

# 连接
await client.connect()

# 获取工具列表
tools = await client.list_tools()

# 调用工具
result = await client.call_tool("add", {"a": 10, "b": 20})

# 断开连接
await client.disconnect()
```

### 完整示例

```python
import asyncio
from basic_client import BasicMCPClient

async def main():
    client = BasicMCPClient(
        server_command="python",
        server_args=["../../1-mcp-servers/stdio-server/python/server.py"]
    )

    try:
        # 连接
        await client.connect()

        # 列出工具
        tools = await client.list_tools()
        for tool in tools:
            print(f"Tool: {tool['name']} - {tool['description']}")

        # 调用工具
        result = await client.call_tool("get_weather", {"city": "Beijing"})
        print(f"Result: {result.content[0].text}")

    finally:
        await client.disconnect()

asyncio.run(main())
```

## 客户端 API

### BasicMCPClient

#### `__init__(server_command, server_args)`

创建客户端实例。

**参数**:
- `server_command` (str): 服务器启动命令（如 "python"）
- `server_args` (list[str]): 服务器启动参数（如 ["server.py"]）

#### `async connect()`

连接到 MCP 服务器并初始化会话。

**异常**:
- `RuntimeError`: 连接失败时抛出

#### `async list_tools() -> list[dict]`

获取服务器提供的所有工具。

**返回**:
- `list[dict]`: 工具列表，每个工具包含 name, description, inputSchema

**示例**:
```python
tools = await client.list_tools()
# [
#   {
#     "name": "add",
#     "description": "两数相加",
#     "inputSchema": {...}
#   },
#   ...
# ]
```

#### `async call_tool(name, arguments) -> Any`

调用指定的工具。

**参数**:
- `name` (str): 工具名称
- `arguments` (dict): 工具参数

**返回**:
- 工具执行结果

**示例**:
```python
result = await client.call_tool("add", {"a": 10, "b": 20})
print(result.content[0].text)  # "30"
```

#### `async disconnect()`

断开与服务器的连接。

## 连接不同类型的服务器

### STDIO 服务器

```python
client = BasicMCPClient(
    server_command="python",
    server_args=["server.py"]
)
```

### SSE 服务器

对于 SSE 服务器，需要使用不同的传输层：

```python
from mcp.client.sse import sse_client

async with sse_client("http://localhost:3001/mcp") as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        # 使用 session
```

## 错误处理

```python
try:
    await client.connect()
    result = await client.call_tool("add", {"a": 10, "b": 20})
except RuntimeError as e:
    print(f"Connection error: {e}")
except Exception as e:
    print(f"Tool call error: {e}")
finally:
    await client.disconnect()
```

## 高级用法

### 自定义客户端

```python
class CustomMCPClient(BasicMCPClient):
    async def call_tool_with_retry(self, name, arguments, max_retries=3):
        """带重试的工具调用"""
        for i in range(max_retries):
            try:
                return await self.call_tool(name, arguments)
            except Exception as e:
                if i == max_retries - 1:
                    raise
                print(f"Retry {i+1}/{max_retries}...")
                await asyncio.sleep(1)
```

### 批量调用

```python
async def batch_call_tools(client, calls):
    """批量调用多个工具"""
    tasks = [
        client.call_tool(call["name"], call["arguments"])
        for call in calls
    ]
    return await asyncio.gather(*tasks, return_exceptions=True)

# 使用
calls = [
    {"name": "add", "arguments": {"a": 1, "b": 2}},
    {"name": "multiply", "arguments": {"a": 3, "b": 4}},
]
results = await batch_call_tools(client, calls)
```

### 工具缓存

```python
class CachedMCPClient(BasicMCPClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._tools_cache = None

    async def list_tools(self):
        """缓存工具列表"""
        if self._tools_cache is None:
            self._tools_cache = await super().list_tools()
        return self._tools_cache
```

## 性能优化

### 连接池

对于频繁调用，可以维护连接池：

```python
class MCPClientPool:
    def __init__(self, size=5):
        self.size = size
        self.clients = []

    async def initialize(self):
        for _ in range(self.size):
            client = BasicMCPClient("python", ["server.py"])
            await client.connect()
            self.clients.append(client)

    async def call_tool(self, name, arguments):
        # 简单的轮询策略
        client = self.clients[0]
        self.clients.append(self.clients.pop(0))
        return await client.call_tool(name, arguments)
```

## 调试

启用详细日志：

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("mcp")
logger.setLevel(logging.DEBUG)
```

## 相关资源

- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [STDIO 服务器示例](../../1-mcp-servers/stdio-server/)
- [返回上级目录](../)
