# Proxy MCP Client - Python

通过 MCP Market 代理层连接和使用 MCP 服务器的客户端实现。

## 功能特性

- ✅ 通过 HTTP API 连接 MCP 服务器
- ✅ 获取所有可用服务器列表
- ✅ 获取服务器工具列表
- ✅ 调用工具并获取结果
- ✅ 测试服务器连接
- ✅ 统一的错误处理

## 前置条件

确保 MCP Market 后端服务正在运行：

```bash
cd ../../backend
npm run dev
```

后端默认运行在 `http://localhost:3000`

## 安装

```bash
pip install -r requirements.txt
```

## 运行

```bash
python proxy_client.py
```

## 代码示例

### 基础使用

```python
from proxy_client import ProxyMCPClient

# 创建客户端
client = ProxyMCPClient("http://localhost:3000")

# 获取服务器列表
servers = await client.list_servers()

# 获取工具列表
tools = await client.list_tools(server_id)

# 调用工具
result = await client.call_tool(server_id, "add", {"a": 10, "b": 20})

# 关闭客户端
await client.close()
```

### 完整示例

```python
import asyncio
from proxy_client import ProxyMCPClient

async def main():
    client = ProxyMCPClient("http://localhost:3000")

    try:
        # 列出所有服务器
        servers = await client.list_servers()
        for server in servers:
            print(f"Server: {server['name']} ({server['id']})")

        # 使用第一个服务器
        server_id = servers[0]["id"]

        # 测试连接
        test_result = await client.test_connection(server_id)
        print(f"Connection test: {test_result}")

        # 获取工具
        tools = await client.list_tools(server_id)
        for tool in tools:
            print(f"Tool: {tool['name']}")

        # 调用工具
        result = await client.call_tool(
            server_id,
            "get_weather",
            {"city": "Beijing"}
        )
        print(f"Result: {result}")

    finally:
        await client.close()

asyncio.run(main())
```

## 客户端 API

### ProxyMCPClient

#### `__init__(proxy_url="http://localhost:3000")`

创建代理客户端实例。

**参数**:
- `proxy_url` (str): MCP Market 代理服务器地址

#### `async list_servers() -> list[dict]`

获取所有可用的 MCP 服务器。

**返回**:
```python
[
  {
    "id": "server-id",
    "name": "Server Name",
    "type": "stdio|sse|http",
    "status": "connected|disconnected"
  },
  ...
]
```

#### `async get_server_info(server_id) -> dict`

获取服务器详细信息。

**参数**:
- `server_id` (str): 服务器 ID

**返回**:
```python
{
  "id": "server-id",
  "name": "Server Name",
  "type": "stdio",
  "config": {...},
  "status": "connected"
}
```

#### `async list_tools(server_id) -> list[dict]`

获取指定服务器的工具列表。

**参数**:
- `server_id` (str): 服务器 ID

**返回**:
```python
[
  {
    "name": "tool_name",
    "description": "Tool description",
    "inputSchema": {...}
  },
  ...
]
```

#### `async call_tool(server_id, tool_name, arguments) -> Any`

调用工具。

**参数**:
- `server_id` (str): 服务器 ID
- `tool_name` (str): 工具名称
- `arguments` (dict): 工具参数

**返回**:
- 工具执行结果

#### `async test_connection(server_id) -> dict`

测试服务器连接。

**参数**:
- `server_id` (str): 服务器 ID

**返回**:
```python
{
  "success": true,
  "message": "Connection successful"
}
```

#### `async close()`

关闭客户端连接。

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

```python
import httpx

try:
    result = await client.call_tool(server_id, "add", {"a": 10, "b": 20})
except httpx.HTTPStatusError as e:
    print(f"HTTP Error: {e.response.status_code}")
    print(f"Response: {e.response.text}")
except httpx.RequestError as e:
    print(f"Request Error: {e}")
except Exception as e:
    print(f"Unexpected Error: {e}")
```

## 高级用法

### 自定义超时

```python
client = ProxyMCPClient("http://localhost:3000")
client.client = httpx.AsyncClient(timeout=60.0)  # 60 秒超时
```

### 添加认证

```python
class AuthProxyMCPClient(ProxyMCPClient):
    def __init__(self, proxy_url, api_key):
        super().__init__(proxy_url)
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"Authorization": f"Bearer {api_key}"}
        )
```

### 批量调用

```python
async def batch_call_tools(client, server_id, calls):
    """��量调用多个工具"""
    tasks = [
        client.call_tool(server_id, call["name"], call["arguments"])
        for call in calls
    ]
    return await asyncio.gather(*tasks, return_exceptions=True)

# 使用
calls = [
    {"name": "add", "arguments": {"a": 1, "b": 2}},
    {"name": "multiply", "arguments": {"a": 3, "b": 4}},
]
results = await batch_call_tools(client, server_id, calls)
```

### 重试机制

```python
async def call_tool_with_retry(client, server_id, tool_name, arguments, max_retries=3):
    """带重试的工具调用"""
    for i in range(max_retries):
        try:
            return await client.call_tool(server_id, tool_name, arguments)
        except Exception as e:
            if i == max_retries - 1:
                raise
            print(f"Retry {i+1}/{max_retries}...")
            await asyncio.sleep(1)
```

### 结果缓存

```python
from functools import lru_cache
import hashlib
import json

class CachedProxyMCPClient(ProxyMCPClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._cache = {}

    def _cache_key(self, server_id, tool_name, arguments):
        key_str = f"{server_id}:{tool_name}:{json.dumps(arguments, sort_keys=True)}"
        return hashlib.md5(key_str.encode()).hexdigest()

    async def call_tool(self, server_id, tool_name, arguments):
        cache_key = self._cache_key(server_id, tool_name, arguments)
        if cache_key in self._cache:
            print("✓ Using cached result")
            return self._cache[cache_key]

        result = await super().call_tool(server_id, tool_name, arguments)
        self._cache[cache_key] = result
        return result
```

## 与 Web 应用集成

### Flask 示例

```python
from flask import Flask, request, jsonify
from proxy_client import ProxyMCPClient

app = Flask(__name__)
client = ProxyMCPClient("http://localhost:3000")

@app.route("/api/tools/<server_id>", methods=["GET"])
async def get_tools(server_id):
    tools = await client.list_tools(server_id)
    return jsonify(tools)

@app.route("/api/call-tool", methods=["POST"])
async def call_tool():
    data = request.json
    result = await client.call_tool(
        data["serverId"],
        data["toolName"],
        data["arguments"]
    )
    return jsonify(result)
```

### FastAPI 示例

```python
from fastapi import FastAPI
from proxy_client import ProxyMCPClient

app = FastAPI()
client = ProxyMCPClient("http://localhost:3000")

@app.get("/api/tools/{server_id}")
async def get_tools(server_id: str):
    return await client.list_tools(server_id)

@app.post("/api/call-tool")
async def call_tool(data: dict):
    return await client.call_tool(
        data["serverId"],
        data["toolName"],
        data["arguments"]
    )
```

## 相关资源

- [MCP Market 后端 API](../../../backend/README.md)
- [直接连接客户端](../python-client/)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [返回上级目录](../)
