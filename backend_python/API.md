# MCP Market Backend API 文档

## 基础信息

- **Base URL**: `http://localhost:3000`
- **API Prefix**: `/api`
- **Content-Type**: `application/json`

## 接口列表

### 1. MCP Server 管理

#### 1.1 获取所有 MCP Server

```
GET /api/mcps
```

**响应示例：**
```json
[
  {
    "id": 1,
    "name": "Weather Server",
    "description": "Provides weather information",
    "connection_type": "stdio",
    "connection_config": {
      "command": "node",
      "args": ["weather-server.js"],
      "env": {}
    },
    "path_prefix": "weather",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### 1.2 获取单个 MCP Server

```
GET /api/mcps/{id}
```

**路径参数：**
- `id` (integer): MCP Server ID

**响应示例：**
```json
{
  "id": 1,
  "name": "Weather Server",
  "description": "Provides weather information",
  "connection_type": "stdio",
  "connection_config": {
    "command": "node",
    "args": ["weather-server.js"],
    "env": {}
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### 1.3 创建 MCP Server

```
POST /api/mcps
```

**请求体：**
```json
{
  "name": "Weather Server",
  "description": "Provides weather information",
  "connection_type": "stdio",
  "connection_config": {
    "command": "node",
    "args": ["weather-server.js"],
    "env": {}
  },
  "path_prefix": "weather"
}
```

**path_prefix 说明：**
- 可选字段，用于生成代理地址
- 格式：仅支持小写字母、数字和连字符，长度 3-50 字符
- 必须全局唯一
- 示例：设置 `path_prefix: "weather"` 后，可通过 `http://localhost:3000/weather/mcp` 访问该服务
- 仅对 `http` 和 `sse` 类型有效（stdio 类型不支持路径代理）

**连接类型说明：**

- **stdio**: 标准输入输出
  ```json
  {
    "connection_type": "stdio",
    "connection_config": {
      "command": "node",
      "args": ["server.js"],
      "env": {"KEY": "value"}
    }
  }
  ```

- **sse**: Server-Sent Events
  ```json
  {
    "connection_type": "sse",
    "connection_config": {
      "url": "http://localhost:3001/sse"
    }
  }
  ```

- **http**: StreamableHTTP
  ```json
  {
    "connection_type": "http",
    "connection_config": {
      "url": "http://localhost:3001/mcp"
    }
  }
  ```

**响应示例：**
```json
{
  "id": 1,
  "name": "Weather Server",
  "description": "Provides weather information",
  "connection_type": "stdio",
  "connection_config": {
    "command": "node",
    "args": ["weather-server.js"],
    "env": {}
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### 1.4 更新 MCP Server

```
PUT /api/mcps/{id}
```

**路径参数：**
- `id` (integer): MCP Server ID

**请求体：** 同创建接口

**响应示例：** 同创建接口

#### 1.5 删除 MCP Server

```
DELETE /api/mcps/{id}
```

**路径参数：**
- `id` (integer): MCP Server ID

**响应示例：**
```json
{
  "message": "MCP server deleted successfully"
}
```

### 2. 连接测试

#### 2.1 测试 MCP Server 连接

```
POST /api/mcps/{id}/test
```

**路径参数：**
- `id` (integer): MCP Server ID

**查询参数：**
- `timeout` (integer, optional): 超时时间（毫秒），默认 10000

**响应示例（成功）：**
```json
{
  "success": true,
  "message": "Connection successful",
  "server_info": {
    "name": "weather-server",
    "version": "1.0.0",
    "protocol_version": "2024-11-05"
  },
  "capabilities": {
    "tools": [
      {
        "name": "get_weather",
        "description": "Get weather information",
        "input_schema": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["city"]
        }
      }
    ],
    "resources": [
      {
        "uri": "weather://current",
        "name": "Current Weather",
        "description": "Current weather data"
      }
    ],
    "prompts": [
      {
        "name": "weather_report",
        "description": "Generate weather report",
        "arguments": [
          {
            "name": "city",
            "description": "City name",
            "required": true
          }
        ]
      }
    ]
  }
}
```

**响应示例（失败）：**
```json
{
  "success": false,
  "message": "Connection failed",
  "error": "Connection timeout"
}
```

### 3. 会话管理

#### 3.1 创建会话

```
POST /api/mcps/{id}/sessions
```

**路径参数：**
- `id` (integer): MCP Server ID

**响应示例：**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "mcp_id": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 3.2 关闭会话

```
DELETE /api/mcps/{id}/sessions/{session_id}
```

**路径参数：**
- `id` (integer): MCP Server ID
- `session_id` (string): Session ID

**响应示例：**
```json
{
  "message": "Session closed successfully"
}
```

#### 3.3 获取会话信息

```
GET /api/mcps/{id}/sessions/{session_id}
```

**路径参数：**
- `id` (integer): MCP Server ID
- `session_id` (string): Session ID

**响应示例：**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "mcp_id": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "server_info": {
    "name": "weather-server",
    "version": "1.0.0",
    "protocol_version": "2024-11-05"
  },
  "capabilities": {
    "tools": [...],
    "resources": [...],
    "prompts": [...]
  }
}
```

### 4. MCP 操作

#### 4.1 调用 Tool

```
POST /api/mcps/{id}/sessions/{session_id}/tools/call
```

**路径参数：**
- `id` (integer): MCP Server ID
- `session_id` (string): Session ID

**请求体：**
```json
{
  "name": "get_weather",
  "arguments": {
    "city": "Beijing"
  }
}
```

**响应示例：**
```json
{
  "content": [
    {
      "type": "text",
      "text": "The weather in Beijing is sunny, 25°C"
    }
  ],
  "isError": false
}
```

#### 4.2 读取 Resource

```
POST /api/mcps/{id}/sessions/{session_id}/resources/read
```

**路径参数：**
- `id` (integer): MCP Server ID
- `session_id` (string): Session ID

**请求体：**
```json
{
  "uri": "weather://current"
}
```

**响应示例：**
```json
{
  "contents": [
    {
      "uri": "weather://current",
      "mimeType": "application/json",
      "text": "{\"temperature\": 25, \"condition\": \"sunny\"}"
    }
  ]
}
```

#### 4.3 获取 Prompt

```
POST /api/mcps/{id}/sessions/{session_id}/prompts/get
```

**路径参数：**
- `id` (integer): MCP Server ID
- `session_id` (string): Session ID

**请求体：**
```json
{
  "name": "weather_report",
  "arguments": {
    "city": "Beijing"
  }
}
```

**响应示例：**
```json
{
  "description": "Weather report for Beijing",
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "Generate a weather report for Beijing"
      }
    }
  ]
}
```

### 5. 路径代理（Path-based Proxy）

#### 5.1 通过路径前缀代理请求

```
ANY /{path_prefix}/{path}
```

**说明：**
- 通过 `path_prefix` 将请求代理到对应的 MCP Server
- 支持所有 HTTP 方法（GET, POST, PUT, DELETE, PATCH, OPTIONS）
- 仅支持 `http` 和 `sse` 类型的服务器
- 自动转发请求头、请求体、查询参数

**路径参数：**
- `path_prefix` (string): MCP Server 的路径前缀
- `path` (string): 剩余路径，将附加到目标 URL

**示例：**

假设创建了以下 MCP Server：
```json
{
  "name": "Weather Server",
  "connection_type": "http",
  "connection_config": {
    "url": "http://10.23.56.64:8000/mcp"
  },
  "path_prefix": "weather"
}
```

则可以通过以下方式访问：
```bash
# 原始地址: http://10.23.56.64:8000/mcp
# 代理地址: http://localhost:3000/weather/mcp

curl http://localhost:3000/weather/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}'
```

**错误响应：**

路径前缀不存在：
```json
{
  "detail": "No MCP server found for path prefix: weather"
}
```

不支持的服务器类型：
```json
{
  "detail": "Path-based proxy only supports http/sse servers, but server 'XXX' is type: stdio"
}
```

上游服务器连接失败：
```json
{
  "detail": "Failed to connect to upstream server: Connection refused"
}
```

### 6. Token 认证代理（可选）

#### 6.1 代理 MCP 请求

```
POST /api/proxy/{mcp_id}
```

**路径参数：**
- `mcp_id` (integer): MCP Server ID

**请求头：**
- `Authorization` (optional): Bearer token

**请求体：** MCP JSON-RPC 请求
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "city": "Beijing"
    }
  }
}
```

**响应示例：** MCP JSON-RPC 响应
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "The weather in Beijing is sunny, 25°C"
      }
    ]
  }
}
```

## 错误响应

所有接口在出错时返回统一格式：

```json
{
  "detail": "Error message"
}
```

**常见 HTTP 状态码：**
- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 数据模型

### McpServer

```typescript
{
  id: number;
  name: string;
  description?: string;
  connection_type: "stdio" | "sse" | "http";
  connection_config: StdioConfig | SseConfig | HttpConfig;
  path_prefix?: string;  // 路径前缀，用于代理路由
  created_at: string;
  updated_at: string;
}
```

### StdioConfig

```typescript
{
  command: string;
  args?: string[];
  env?: Record<string, string>;
}
```

### SseConfig

```typescript
{
  url: string;
}
```

### HttpConfig

```typescript
{
  url: string;
}
```

### Tool

```typescript
{
  name: string;
  description?: string;
  input_schema: object;
}
```

### Resource

```typescript
{
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}
```

### Prompt

```typescript
{
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}
```

## 开发说明

### 启动服务器

```bash
cd backend_python
uv run uvicorn src.main:app --host 0.0.0.0 --port 3000
```

### API 文档

启动服务器后访问：
- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

### 数据库

使用 SQLite，数据库文件：`mcp_market.db`

### 环境变量

可选配置（通过 `.env` 文件）：
- `DATABASE_URL`: 数据库路径（默认：`./mcp_market.db`）
- `PORT`: 服务器端口（默认：`3000`）
