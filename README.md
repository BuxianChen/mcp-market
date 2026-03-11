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
- 后端：Python 3.11+ + FastAPI + Uvicorn
- 数据库：SQLite
- MCP SDK: mcp (Python SDK)

## 架构说明

本项目采用**前后端分离**架构：

- `backend_python/` - Python FastAPI 后端服务
- `frontend/` - React 前端应用
- 前后端可独立部署

## 快速开始

### 安装依赖

**后端依赖**：
```bash
cd backend_python
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**前端依赖**：
```bash
cd frontend
npm install
```

### 启动开发服务器

**后端服务**（端口 3000）：
```bash
cd backend_python
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn src.main:app --host 0.0.0.0 --port 3000 --reload
```

**前端服务**（端口 5173）：
```bash
cd frontend
npm run dev
```

### 数据库迁移

首次运行或更新数据库结构时：
```bash
cd backend_python
source .venv/bin/activate
python src/db/migrate.py mcp_market.db
```

### 构建生产版本

```bash
# 前端构建
cd frontend
npm run build
```

## 项目结构

```
```
mcp-market/
├── backend_python/             # FastAPI 后端 API
│   ├── .venv/                 # Python 虚拟环境
│   ├── src/
│   │   ├── routes/            # 路由
│   │   │   ├── mcp.py        # MCP CRUD 和测试
│   │   │   ├── proxy.py      # 代理服务
│   │   │   └── proxy_path.py # 路径代理
│   │   ├── services/          # 业务逻辑
│   │   │   ├── mcp_service.py         # MCP 服务管理
│   │   │   ├── mcp_session_service.py # 会话管理
│   │   │   └── mcp_test_service.py    # 连接测试
│   │   ├── db/                # 数据库
│   │   │   ├── schema.sql    # 数据库结构
│   │   │   └── migrate.py    # 迁移脚本
│   │   ├── types/             # 类型定义
│   │   └── main.py           # 应用入口
│   ├── requirements.txt
│   └── mcp_market.db         # SQLite 数据库
│
├── frontend/                   # React 前端应用
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── api/               # API 服务
│   │   └── types/             # 类型定义
│   └── package.json
│
└── verified_examples/          # 验证过的示例
    └── mcp-servers/           # MCP 服务器示例
```
```

## 使用说明

### 访问应用

1. 启动后端和前端服务后，打开浏览器访问 http://localhost:5173
2. 添加 MCP Server 配置
3. 测试连接并查看可用工具
4. 使用交互式测试器调用工具

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

详细的 API 文档请查看 [backend_python/API.md](backend_python/API.md)

### 主要接口

- `GET /api/mcps` - 获取所有 MCP 服务器
- `POST /api/mcps` - 添加 MCP 服务器
- `GET /api/mcps/{id}` - 获取服务器详情
- `PUT /api/mcps/{id}` - 更新服务器
- `DELETE /api/mcps/{id}` - 删除服务器
- `POST /api/mcps/{id}/test` - 测试服务器连接

### 路径代理

- `/{path_prefix}/{path:path}` - 通过 path_prefix 代理访问 MCP 服务器
  - 例如：`http://localhost:3000/weather/mcp` 代理到配置的原始 URL

## 故障排查

### 连接失败

- 检查 MCP Server 是否正在运行
- 验证 URL 或命令路径是否正确
- 查看后端日志获取详细错误信息

### 前端无法连接后端

- 确认后端运行在 http://localhost:3000
- 检查 CORS 配置
- 查看浏览器控制台错误

### 数据库问题

- 运行迁移脚本：`python src/db/migrate.py mcp_market.db`
- 检查数据库文件权限

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
