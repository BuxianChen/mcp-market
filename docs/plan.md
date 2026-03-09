# MCP 中台企业级功能增强实现计划

## Context

这是一个企业级 MCP 中台项目，目标是作为中间层统一管理和代理企业内部各业务系统的 MCP Server。当前项目已实现基础的 MCP Server 配置管理和连接测试功能，但缺少核心的代理转发、交互式测试、HTTP 服务转换等企业级功能。

**当前架构：**
- 前端：React 18 + TypeScript + Vite + TailwindCSS
- 后端：Node.js + Express + TypeScript + SQLite
- 使用 npm workspaces 管理（根目录统一 node_modules）
- 已实现：MCP Server CRUD、基础连接测试（列举 tools/resources/prompts）

**核心问题：**
1. 只能测试连接，不能实际调用 MCP Server 的工具
2. 缺少代理层，无法作为统一入口供下游 MCP Client 连接
3. 不支持将普通 HTTP RESTful 服务转换为 MCP Server
4. Examples 目录结构混乱，缺少完整示例

**用户背景：** 主要技术栈 Python，熟悉 Docker/MySQL/SQLite/Redis

---

## 实现方案

### 1. 项目结构优化

**结论：保持现有 npm workspaces 结构**

当前使用 npm workspaces 将依赖提升到根目录是最佳实践，无需调整。这种结构的优点：
- 减少重复安装，节省磁盘空间
- 加快安装速度
- 便于统一管理依赖版本

**无需修改任何文件**

---

### 2. 前端交互式测试功能（类似 MCP Inspector）

**目标：** 实现类似 `npx @modelcontextprotocol/inspector` 的功能，支持实际调用 tools、读取 resources、测试 prompts

**架构设计：**

#### 后端实现

**新增会话管理服务：**
- 文件：`backend/src/services/mcpSessionService.ts`
- 功能：
  - 管理持久化的 MCP Client 连接（使用 Map 存储 sessionId → Client）
  - 连接池管理（每个 MCP Server 最多 5 个并发会话）
  - 自动超时清理（30 分钟无活动自动断开）
  - 支持 SSE 和 stdio 两种 transport

**新增 API 端点：**
- `POST /api/mcps/:id/sessions` - 创建会话（建立持久连接）
- `DELETE /api/mcps/:id/sessions/:sessionId` - 关闭会话
- `POST /api/mcps/:id/sessions/:sessionId/call-tool` - 调用工具
  - 请求体：`{ toolName: string, arguments: Record<string, any> }`
  - 返回：工具执行结果
- `GET /api/mcps/:id/sessions/:sessionId/resources` - 列举资源
- `GET /api/mcps/:id/sessions/:sessionId/resources/read` - 读取资源
  - 查询参数：`uri=<resource_uri>`
- `POST /api/mcps/:id/sessions/:sessionId/prompts/:promptName` - 调用提示
  - 请求体：`{ arguments: Record<string, any> }`

**修改文件：**
- `backend/src/controllers/mcpController.ts` - 添加会话和交互式测试相关的控制器方法
- `backend/src/routes/mcp.ts` - 添加新路由
- `backend/src/types/mcp.ts` - 添加会话相关类型定义

#### 前端实现

**新增交互式测试组件：**
- 文件：`frontend/src/components/InteractiveTester.tsx`
- 布局：
  - 顶部：连接状态栏（显示会话 ID、连接时长）
  - 左侧面板：工具/资源/提示列表（可折叠的 Tabs）
  - 右侧面板：
    - 工具调用：参数输入表单（基于 inputSchema 动态生成）+ 执行按钮 + 结果展示
    - 资源浏览：树形列表 + 内容预览
    - 提示测试：参数输入 + 生成结果
  - 底部：历史记录面板（最近 10 次调用，可清空）

**新增子组件：**
- `frontend/src/components/ToolCallPanel.tsx` - 工具调用面板
  - 动态表单生成（根据 JSON Schema）
  - JSON 编辑器（使用 textarea，支持语法高亮）
  - 结果展示（格式化 JSON）
- `frontend/src/components/ResourceBrowser.tsx` - 资源浏览器
  - 资源列表（显示 URI、名称、描述）
  - 内容预览（支持文本、JSON）
- `frontend/src/components/PromptTester.tsx` - 提示测试器

**修改文件：**
- `frontend/src/components/McpCard.tsx` - 添加"交互式测试"按钮
- `frontend/src/api/mcp.ts` - 添加会话和交互式测试相关的 API 调用
- `frontend/src/types/mcp.ts` - 添加会话相关类型定义

**技术要点：**
- 参数表单使用受控组件，支持嵌套对象和数组
- 使用 `JSON.stringify(data, null, 2)` 格式化输出
- 错误处理：显示详细错误信息和堆栈

---

### 3. MCP 代理层（地址转换功能）

**目标：** MCP 中台作为统一代理入口，下游 MCP Client 通过中台连接到实际的 MCP Server

**架构设计：**

```
MCP Client → MCP 中台代理 (/proxy/:serverId/mcp)
                ↓
          权限验证 + 日志记录
                ↓
          实际 MCP Server
```

#### 数据库扩展

**新增表：**

```sql
-- 访问令牌表
CREATE TABLE mcp_access_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  server_id INTEGER NOT NULL,
  name TEXT,
  permissions TEXT, -- JSON: ["tools", "resources", "prompts"]
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE
);

-- 访问日志表
CREATE TABLE mcp_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER NOT NULL,
  token_id INTEGER,
  action TEXT NOT NULL, -- "call_tool", "read_resource", "get_prompt"
  tool_name TEXT,
  resource_uri TEXT,
  status TEXT NOT NULL, -- "success", "error"
  error_message TEXT,
  duration_ms INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE,
  FOREIGN KEY (token_id) REFERENCES mcp_access_tokens(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_access_logs_server_id ON mcp_access_logs(server_id);
CREATE INDEX idx_access_logs_timestamp ON mcp_access_logs(timestamp);
CREATE INDEX idx_access_tokens_server_id ON mcp_access_tokens(server_id);
```

**修改文件：** `backend/src/db/schema.sql`

#### 后端实现

**新增代理服务：**
- 文件：`backend/src/services/mcpProxyService.ts`
- 功能：
  - 接收下游 Client 的 SSE 连接请求
  - 查询数据库获取目标 Server 配置
  - 建立到上游 Server 的连接
  - 双向消息转发（透明代理）
  - 消息拦截和日志记录
  - 连接生命周期管理

**新增认证中间件：**
- 文件：`backend/src/middleware/proxyAuth.ts`
- 功能：
  - 验证 Authorization header 中的 Bearer token
  - 检查 token 是否过期
  - 验证权限（tools/resources/prompts）
  - 将 token 信息注入 request 对象

**新增代理控制器和路由：**
- 文件：`backend/src/controllers/proxyController.ts`
- 文件：`backend/src/routes/proxy.ts`
- 端点：
  - `GET /proxy/:serverId/mcp` - SSE 代理端点（建立 SSE 连接）
  - `POST /proxy/:serverId/mcp/messages/` - SSE POST 消息端点

**Token 管理 API：**
- `POST /api/mcps/:id/tokens` - 创建访问令牌
- `GET /api/mcps/:id/tokens` - 列举令牌
- `DELETE /api/mcps/:id/tokens/:tokenId` - 删除令牌
- `GET /api/mcps/:id/logs` - 查询访问日志

**修改文件：**
- `backend/src/app.ts` - 注册代理路由
- `backend/src/controllers/mcpController.ts` - 添加 token 和日志管理方法

#### 前端实现

**新增 Token 管理界面：**
- 文件：`frontend/src/components/TokenManagement.tsx`
- 功能：
  - 创建 token（设置名称、权限、过期时间）
  - 列举和删除 token
  - 显示 token 使用示例代码

**新增访问日志界面：**
- 文件：`frontend/src/components/AccessLogs.tsx`
- 功能：
  - 分页显示访问日志
  - 过滤（按时间、操作类型、状态）
  - 统计图表（调用次数、成功率）

**修改文件：**
- `frontend/src/components/McpCard.tsx` - 添加"Token 管理"和"访问日志"按钮
- `frontend/src/api/mcp.ts` - 添加 token 和日志相关 API

**客户端使用示例：**
```typescript
// 通过中台代理连接
const transport = new SSEClientTransport(
  new URL('http://mcp-platform:3000/proxy/123/mcp'),
  { headers: { 'Authorization': 'Bearer <your-token>' } }
);
const client = new Client({ name: 'my-client', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);
```

---

### 4. HTTP 服务自动转化为 MCP Server

**目标：** 将普通 RESTful API 包装成 MCP Server，通过配置映射规则自动转换

**架构设计：**

#### 数据库扩展

**新增表：**

```sql
CREATE TABLE http_to_mcp_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  tool_description TEXT,
  http_method TEXT NOT NULL CHECK(http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  http_url TEXT NOT NULL,
  http_headers TEXT, -- JSON: {"Authorization": "Bearer ${env.API_TOKEN}"}
  input_schema TEXT NOT NULL, -- JSON Schema
  response_mapping TEXT, -- JSON: {"result": "$.data.result"}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE,
  UNIQUE(server_id, tool_name)
);

CREATE TRIGGER update_http_mappings_timestamp
AFTER UPDATE ON http_to_mcp_mappings
BEGIN
  UPDATE http_to_mcp_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

**修改文件：** `backend/src/db/schema.sql`

#### 后端实现

**新增 HTTP 转 MCP 适配器：**
- 文件：`backend/src/services/httpToMcpAdapter.ts`
- 功能：
  - 读取映射配置
  - 动态生成 MCP Tool 定义（基于 inputSchema）
  - 参数转换：将 MCP tool arguments 映射到 HTTP 请求
    - URL 参数替换（`/users/{user_id}` → `/users/123`）
    - Query 参数构建
    - Request body 构建
  - 响应转换：HTTP 响应 → MCP TextContent
    - 使用 JSONPath 提取字段（支持 `$.data.result` 语法）
    - 错误处理（HTTP 错误码 → MCP 错误）
  - 环境变量替换（`${env.API_TOKEN}`）

**新增 OpenAPI 解析器（可选）：**
- 文件：`backend/src/services/openApiParser.ts`
- 功能：
  - 解析 OpenAPI 3.0 规范
  - 自动生成映射配置
  - 支持上传 JSON/YAML 文件

**新增映射管理 API：**
- `POST /api/mcps/:id/mappings` - 创建映射
- `GET /api/mcps/:id/mappings` - 列举映射
- `PUT /api/mcps/:id/mappings/:mappingId` - 更新映射
- `DELETE /api/mcps/:id/mappings/:mappingId` - 删除映射
- `POST /api/mcps/:id/mappings/import-openapi` - 导入 OpenAPI 规范

**修改文件：**
- `backend/src/controllers/mcpController.ts` - 添加映射管理方法
- `backend/src/routes/mcp.ts` - 添加映射路由
- `backend/src/services/mcpProxyService.ts` - 集成 httpToMcpAdapter，在代理时处理 HTTP 类型的 server

**依赖添加：**
- `jsonpath-plus` - JSONPath 查询
- `axios` - HTTP 请求（已有）

#### 前端实现

**新增 HTTP 映射配置界面：**
- 文件：`frontend/src/components/HttpMappingConfig.tsx`
- 功能：
  - 映射列表（显示工具名称、HTTP 方法、URL）
  - 添加/编辑映射表单：
    - 工具名称和描述
    - HTTP 方法和 URL（支持路径参数 `{param}`）
    - Headers 配置（键值对输入）
    - Input Schema 编辑器（JSON 编辑器）
    - 响应映射配置（JSONPath 表达式）
  - 测试工具（发送测试请求验证配置）

**新增 OpenAPI 导入器（可选）：**
- 文件：`frontend/src/components/OpenApiImporter.tsx`
- 功能：
  - 上传 OpenAPI JSON/YAML 文件
  - 预览生成的映射
  - 批量导入

**修改文件：**
- `frontend/src/components/McpCard.tsx` - 对于 HTTP 类型的 server，添加"配置映射"按钮
- `frontend/src/api/mcp.ts` - 添加映射管理 API

**配置示例：**
```json
{
  "tool_name": "get_user_info",
  "tool_description": "获取用户信息",
  "http_method": "GET",
  "http_url": "https://api.example.com/users/{user_id}",
  "http_headers": {
    "Authorization": "Bearer ${env.API_TOKEN}",
    "Content-Type": "application/json"
  },
  "input_schema": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "用户 ID"
      }
    },
    "required": ["user_id"]
  },
  "response_mapping": {
    "name": "$.data.name",
    "email": "$.data.email",
    "created_at": "$.data.created_at"
  }
}
```

---

### 5. Examples 目录重组

**目标：** 提供完整的示例代码，覆盖各种使用场景

**新目录结构：**

```
examples/
├── servers/                          # MCP Server 示例
│   ├── python-mcp-server/           # 标准 MCP Server (Python)
│   │   ├── src/
│   │   │   ├── server.py           # SSE transport
│   │   │   ├── stdio_server.py     # stdio transport
│   │   │   └── tools/              # 工具实现
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── nodejs-mcp-server/           # 标准 MCP Server (Node.js)
│   │   ├── src/
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── restful-service/             # 普通 RESTful 服务示例
│       ├── app.py                  # FastAPI 实现
│       ├── openapi.json            # OpenAPI 规范
│       ├── requirements.txt
│       └── README.md               # 说明如何通过中台转换
│
├── clients/                          # MCP Client 示例
│   ├── python-sdk-client/           # Python SDK 直接连接
│   │   ├── basic_client.py         # 基础连接
│   │   ├── proxy_client.py         # 通过中台代理连接
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── nodejs-sdk-client/           # Node.js SDK
│   │   ├── src/
│   │   │   ├── basic_client.ts
│   │   │   └── proxy_client.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── curl-examples/               # curl 测试示例
│       ├── sse-connection.sh
│       ├── proxy-connection.sh
│       └── README.md
│
├── agents/                           # AI Agent 示例
│   ├── langgraph-agent/             # LangGraph + MCP（迁移自 agent-demo）
│   │   └── ...
│   │
│   └── simple-agent/                # 最简单的 Agent（纯 Python）
│       ├── agent.py
│       ├── requirements.txt
│       └── README.md
│
└── integrations/                     # IDE/工具集成示例
    ├── cline-config/                # Cline/Claude Code 配置
    │   ├── cline_mcp_settings.json
    │   └── README.md
    │
    └── cursor-config/               # Cursor 配置
        └── README.md
```

**迁移计划：**
- `examples/mcp-server/` → `examples/servers/python-mcp-server/`（保留并增强）
- `examples/agent-demo/` → `examples/agents/langgraph-agent/`
- `examples/deepagents-demo/` → 评估后决定保留或移除

**新增示例（优先级）：**
1. **restful-service**（高优先级）
   - 使用 FastAPI 实现简单的用户管理 API
   - 提供 OpenAPI 规范
   - README 详细说明如何在中台配置转换

2. **proxy_client.py**（高优先级）
   - 演示如何通过中台代理连接
   - 包含 Token 认证
   - 错误处理和重试

3. **simple-agent**（中优先级）
   - 最小化依赖，纯 Python 实现
   - 不依赖 LangChain/LangGraph
   - 适合学习 MCP 协议

4. **nodejs-mcp-server**（中优先级）
   - 使用 @modelcontextprotocol/sdk 实现
   - 提供不同于 Python 的实现参考

5. **curl-examples**（低优先级）
   - 用于快速测试和调试
   - 不需要编写代码

---

## 实现优先级和阶段

### Phase 1: 交互式测试功能（1-2 周）
**目标：** 让用户能够实际调用 MCP Server 的工具

**关键文件：**
- `backend/src/services/mcpSessionService.ts`（新建）
- `backend/src/controllers/mcpController.ts`（修改）
- `backend/src/routes/mcp.ts`（修改）
- `frontend/src/components/InteractiveTester.tsx`（新建）
- `frontend/src/components/ToolCallPanel.tsx`（新建）

**验证方式：**
1. 启动示例 MCP Server
2. 在前端添加并连接
3. 点击"交互式测试"
4. 选择一个工具，输入参数，执行
5. 验证返回结果正确

### Phase 2: MCP 代理层（2-3 周）
**目标：** 实现统一的代理入口和权限管理

**关键文件：**
- `backend/src/db/schema.sql`（修改，添加 token 和日志表）
- `backend/src/services/mcpProxyService.ts`（新建）
- `backend/src/middleware/proxyAuth.ts`（新建）
- `backend/src/controllers/proxyController.ts`（新建）
- `backend/src/routes/proxy.ts`（新建）
- `frontend/src/components/TokenManagement.tsx`（新建）
- `frontend/src/components/AccessLogs.tsx`（新建）

**验证方式：**
1. 创建访问 token
2. 使用 MCP SDK 通过代理端点连接
3. 调用工具，验证代理转发正常
4. 查看访问日志，验证记录正确
5. 测试权限控制（删除 tools 权限后无法调用工具）

### Phase 3: HTTP 转 MCP 功能（2-3 周）
**目标：** 支持将 RESTful API 转换为 MCP Server

**关键文件：**
- `backend/src/db/schema.sql`（修改，添加映射表）
- `backend/src/services/httpToMcpAdapter.ts`（新建）
- `backend/src/controllers/mcpController.ts`（修改）
- `frontend/src/components/HttpMappingConfig.tsx`（新建）
- `examples/servers/restful-service/app.py`（新建）

**验证方式：**
1. 启动 restful-service 示例
2. 在中台添加 HTTP 类型的 MCP Server
3. 配置映射（将 GET /users/{id} 映射为 get_user 工具）
4. 通过代理调用工具，验证 HTTP 请求正确发送
5. 验证响应正确转换为 MCP 格式

### Phase 4: Examples 重组和文档（1 周）
**目标：** 完善示例代码和文档

**关键文件：**
- `examples/servers/restful-service/`（新建）
- `examples/clients/python-sdk-client/proxy_client.py`（新建）
- `examples/agents/simple-agent/`（新建）
- 各目录的 README.md

**验证方式：**
1. 按照 README 从零开始运行每个示例
2. 验证所有示例都能正常工作
3. 确保文档清晰易懂

---

## 关键文件清单

### 需要新建的文件

**后端：**
- `backend/src/services/mcpSessionService.ts` - 会话管理
- `backend/src/services/mcpProxyService.ts` - 代理服务
- `backend/src/services/httpToMcpAdapter.ts` - HTTP 转 MCP 适配器
- `backend/src/middleware/proxyAuth.ts` - 代理认证中间件
- `backend/src/controllers/proxyController.ts` - 代理控制器
- `backend/src/routes/proxy.ts` - 代理路由

**前端：**
- `frontend/src/components/InteractiveTester.tsx` - 交互式测试主界面
- `frontend/src/components/ToolCallPanel.tsx` - 工具调用面板
- `frontend/src/components/ResourceBrowser.tsx` - 资源浏览器
- `frontend/src/components/PromptTester.tsx` - 提示测试器
- `frontend/src/components/TokenManagement.tsx` - Token 管理
- `frontend/src/components/AccessLogs.tsx` - 访问日志
- `frontend/src/components/HttpMappingConfig.tsx` - HTTP 映射配置

**示例：**
- `examples/servers/restful-service/app.py` - RESTful 服务示例
- `examples/clients/python-sdk-client/proxy_client.py` - 代理连接示例
- `examples/agents/simple-agent/agent.py` - 简单 Agent 示例

### 需要修改的文件

**后端：**
- `backend/src/db/schema.sql` - 添加 token、日志、映射表
- `backend/src/controllers/mcpController.ts` - 添加会话、token、映射管理方法
- `backend/src/routes/mcp.ts` - 添加新路由
- `backend/src/types/mcp.ts` - 添加新类型定义
- `backend/src/app.ts` - 注册代理路由

**前端：**
- `frontend/src/components/McpCard.tsx` - 添加新按钮
- `frontend/src/api/mcp.ts` - 添加新 API 调用
- `frontend/src/types/mcp.ts` - 添加新类型定义

**配置：**
- `backend/package.json` - 添加新依赖（jsonpath-plus）

---

## 技术注意事项

1. **会话管理：** 使用 Map 存储会话，定期清理过期会话（setInterval）
2. **代理转发：** 需要正确处理 SSE 的流式传输，保持连接活跃
3. **权限验证：** 在消息拦截层验证权限，拒绝未授权的操作
4. **错误处理：** 所有 API 都需要完善的错误处理和日志记录
5. **参数验证：** 使用 Zod 验证所有输入参数
6. **JSONPath：** 使用 jsonpath-plus 库处理响应映射
7. **环境变量：** 支持 `${env.VAR_NAME}` 语法，从 process.env 读取

---

## 文档管理

**计划文档位置：**
- Claude Code 自动保存计划到：`~/.claude/plans/sharded-knitting-bentley.md`
- 建议复制到项目目录：`docs/implementation-plan.md`
- 便于版本控制和团队协作

**项目文档结构：**
```
docs/
├── implementation-plan.md    # 本实现计划
├── api-design.md            # API 设计文档（待创建）
├── architecture.md          # 架构设计文档（待创建）
└── deployment.md            # 部署文档（待创建）
```

---

## 后续扩展（可选）

1. **多租户支持：** 添加租户表，实现资源隔离
2. **监控告警：** 集成 Prometheus，添加 metrics 端点
3. **高可用：** 支持多实例部署，使用 Redis 共享会话
4. **审计日志：** 完整的操作审计，支持合规性报告
5. **WebSocket 支持：** 对于长时间运行的工具，使用 WebSocket 推送进度
