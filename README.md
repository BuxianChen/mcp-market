# MCP 市场平台

企业内部 MCP（Model Context Protocol）市场平台，用于管理和测试远程 MCP Server。

## 功能特性

- ✅ 添加和管理远程 MCP Server
- ✅ 支持 HTTP (Streamable HTTP)、SSE、STDIO 三种连接类型
- ✅ 交互式测试 MCP Server（工具调用、资源读取、提示获取）
- ✅ MCP 代理层（Token 认证、访问日志）
- ✅ HTTP 转 MCP 适配器
- ✅ 完整的示例项目（服务器、客户端、Agent 集成）

## 技术栈

- 前端：React 18 + TypeScript + Vite + TailwindCSS
- 后端：Node.js + Express + TypeScript
- 数据库：SQLite
- MCP SDK: @modelcontextprotocol/sdk ^1.27.1

## 架构说明

本项目采用**前后端分离**架构：

- `backend/` - 独立的后端服务，有自己的 node_modules
- `frontend/` - 独立的前端应用，有自己的 node_modules
- 不使用 npm workspaces，前后端可独立部署

## 快速开始

### 安装依赖

前后端需要分别安装依赖：

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动开发服务器

**后端服务**（端口 3000）：
```bash
cd backend
npm run dev
```

**前端服务**（端口 5173）：
```bash
cd frontend
npm run dev
```

### 构建生产版本

```bash
# 构建后端
cd backend
npm run build

# 构建前端
cd frontend
npm run build
```

## 项目结构

```
mcp-market/
├── backend/                    # Express 后端 API
│   ├── node_modules/          # 后端独立依赖
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── services/          # 业务逻辑
│   │   │   ├── mcpSessionService.ts      # MCP 会话管理
│   │   │   ├── mcpProxyService.ts        # MCP 代理服务
│   │   │   └── httpToMcpAdapter.ts       # HTTP 转 MCP
│   │   ├── routes/            # 路由
│   │   ├── db/                # 数据库
│   │   └── types/             # 类型定义
│   └── package.json
│
├── frontend/                   # React 前端应用
│   ├── node_modules/          # 前端独立依赖
│   ├── src/
│   │   ├── components/        # React 组件
│   │   │   ├── InteractiveTester.tsx     # 交互式测试
│   │   │   ├── TokenManagement.tsx       # Token 管理
│   │   │   └── HttpMappingConfig.tsx     # HTTP 映射配置
│   │   ├── pages/             # 页面
│   │   └── services/          # API 服务
��   └── package.json
│
└── examples/                   # 示例项目
    ├── 1-mcp-servers/         # MCP 服务器示例
    │   ├── stdio-server/      # STDIO 服务器
    │   ├── sse-server/        # SSE 服务器
    │   └── http-server/       # HTTP 服务器
    ├── 2-mcp-clients/         # MCP 客户端示例
    │   ├── python-client/     # Python 客户端
    │   ├── nodejs-client/     # Node.js 客户端
    │   └── proxy-client/      # 代理客户端
    ├── 3-agent-integration/   # Agent 集成示例
    │   ├── simple-agent/      # 简单 Agent
    │   ├── deepseek-agent/    # DeepSeek Agent
    │   └── langchain-agent/   # LangChain Agent
    └── 4-http-to-mcp/         # HTTP 转 MCP 配置
```

## 示例项目

查看 [examples/](examples/) 目录获取完整的示例代码和文档。

### 1. MCP 服务器示例

- **STDIO Server** - 标准输入输出服务器（Python）
- **SSE Server** - Server-Sent Events 服务器（Python）
- **HTTP Server** - Streamable HTTP 服务器（Python）

### 2. MCP 客户端示例

- **Python Client** - 直接连接 MCP 服务器
- **Node.js Client** - 直接连接 MCP 服务器
- **Proxy Client** - 通过 MCP Market 代理连接

### 3. Agent 集成示例

- **Simple Agent** - 简单的 Agent 实现（教学示例）
- **DeepSeek Agent** - 使用 DeepSeek API 的生产级 Agent
- **LangChain Agent** - LangChain 框架集成

### 4. HTTP 转 MCP

- 天气 API 映射配置
- GitHub API 映射配置
- OpenAI API 映射配置
- 自定义 API 模板

## 完整演示流程

### 1. 启动 MCP 市场平台

```bash
# 终端 1: 启动后端
cd backend
npm run dev

# 终端 2: 启动前端
cd frontend
npm run dev
```

### 2. 启动示例 MCP Server

```bash
# 使用 STDIO Server
cd examples/1-mcp-servers/stdio-server/python
pip install -r requirements.txt
python src/server.py

# 或使用 HTTP Server
cd examples/1-mcp-servers/http-server/python
pip install -r requirements.txt
python src/server.py
```

### 3. 在浏览器中测试

1. 打开 http://localhost:5173
2. 添加 MCP Server：
   - **STDIO Server**:
     - 名称: STDIO Example
     - 类型: STDIO
     - 命令: python
     - 参数: ["/path/to/examples/1-mcp-servers/stdio-server/python/src/server.py"]

   - **HTTP Server**:
     - 名称: HTTP Example
     - 类型: HTTP
     - URL: http://localhost:8000

3. 测试连接，查看可用工具
4. 使用交互式测试器调用工具

### 4. 运行 Agent 示例（可选）

```bash
# Simple Agent
cd examples/3-agent-integration/simple-agent
pip install -r requirements.txt
python src/simple_agent.py

# DeepSeek Agent（需要 API Key）
cd examples/3-agent-integration/deepseek-agent
export DEEPSEEK_API_KEY="your-api-key"
python src/deepseek_agent.py
```

## 支持的连接类型

### HTTP (Streamable HTTP)
- 使用 `StreamableHTTPClientTransport`
- 支持 POST 发送消息，GET SSE 接收消息
- 适合生产环境的 HTTP 服务器

### SSE (Server-Sent Events)
- 使用 `SSEClientTransport`
- 单向流式传输
- 适合简单的服务器推送场景

### STDIO (Standard I/O)
- 使用 `StdioClientTransport`
- 通过标准输入输出通信
- 适合本地进程和命令行工具

## API 文档

### 后端 API

- `GET /api/mcp/servers` - 获取所有 MCP 服务器
- `POST /api/mcp/servers` - 添加 MCP 服务器
- `GET /api/mcp/servers/:id` - 获取服务器详情
- `PUT /api/mcp/servers/:id` - 更新服务器
- `DELETE /api/mcp/servers/:id` - 删除服务器
- `POST /api/mcp/test` - 测试服务器连接

### 交互式测试 API

- `POST /api/mcp/sessions` - 创建会话
- `DELETE /api/mcp/sessions/:id` - 关闭会话
- `POST /api/mcp/sessions/:id/call-tool` - 调用工具
- `GET /api/mcp/sessions/:id/resources` - 列出资源
- `POST /api/mcp/sessions/:id/read-resource` - 读取资源
- `GET /api/mcp/sessions/:id/prompts` - 列出提示
- `POST /api/mcp/sessions/:id/get-prompt` - 获取提示

### 代理 API

- `POST /api/proxy/tokens` - 创建访问 Token
- `GET /api/proxy/tokens` - 列出 Token
- `DELETE /api/proxy/tokens/:id` - 删除 Token
- `GET /api/proxy/logs` - 查看访问日志
- `GET /api/proxy/:serverId/*` - 代理请求

### HTTP 转 MCP API

- `GET /api/http-to-mcp/mappings` - 获取映射配置
- `POST /api/http-to-mcp/mappings` - 创建映射
- `PUT /api/http-to-mcp/mappings/:id` - 更新映射
- `DELETE /api/http-to-mcp/mappings/:id` - 删除映射

## 开发指南

### 添加新的传输类型

1. 在 `backend/src/types/mcp.ts` 中添加类型定义
2. 在 `backend/src/services/mcpSessionService.ts` 中添加传输实现
3. 在前端添加相应的 UI 配置

### 扩展 HTTP 转 MCP

1. 在 `examples/4-http-to-mcp/` 中创建映射配置
2. 使用前端的 HTTP 映射配置界面导入
3. 测试映射是否正确工作

## 故障排查

### 连接失败

- 检查 MCP Server 是否正在运行
- 验证 URL 或命令路径是否正确
- 查看后端日志获取详细错误信息

### STDIO 服务器无法启动

- 确保 Python 路径正确
- 检查依赖是否已安装
- 使用绝对路径而非相对路径

### 前端无法连接后端

- 确认后端运行在 http://localhost:3000
- 检查 CORS 配置
- 查看浏览器控制台错误

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
