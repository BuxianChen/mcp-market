# MCP 市场平台

企业内部 MCP（Model Context Protocol）市场平台，用于管理和测试远程 MCP Server。

## 功能特性

- 添加和管理远程 MCP Server
- 支持 HTTP、SSE、stdio 三种连接类型
- 测试 MCP Server 连接和功能
- 查看 MCP Server 提供的 tools、resources、prompts

## 技术栈

- 前端：React 18 + TypeScript + Vite + TailwindCSS
- 后端：Node.js + Express + TypeScript
- 数据库：SQLite

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

后端服务（端口 3000）：
```bash
npm run dev:backend
```

前端服务（端口 5173）：
```bash
npm run dev:frontend
```

### 构建生产版本

```bash
npm run build:backend
npm run build:frontend
```

## 项目结构

```
mcp-market/
├── frontend/          # React 前端应用
├── backend/           # Express 后端 API
└── examples/          # 示例项目
    ├── mcp-server/    # Python MCP Server 示例
    └── agent-demo/    # Python Agent 示例
```

## 示例项目

### MCP Server 示例 (Python)

一个简单的 MCP Server 实现，提供计算器、天气查询和文本处理工具。

**启动方式：**
```bash
cd examples/mcp-server
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m src.server
```

服务器将在 http://localhost:3001 启动。

详细说明请查看 [examples/mcp-server/README.md](examples/mcp-server/README.md)

### Agent 示例 (Python + LangGraph)

使用 LangGraph 构建的 Agent，通过 MCP 协议调用工具。

**启动方式：**
```bash
cd examples/agent-demo
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 填入 OPENAI_API_KEY 和 OPENAI_BASE_URL（可选）
python -m src.main
```

详细说明请查看 [examples/agent-demo/README.md](examples/agent-demo/README.md)

## 完整演示流程

1. 启动 MCP 市场后端：
```bash
npm run dev:backend
```

2. 启动 MCP 市场前端：
```bash
npm run dev:frontend
```

3. 启动示例 MCP Server：
```bash
npm run dev:mcp-server
```

4. 在浏览器中打开 http://localhost:5173，添加示例 MCP Server：
   - 名称: Example MCP Server
   - 类型: SSE
   - URL: http://localhost:3001/mcp

5. 测试连接，查看可用工具

6. 启动 Agent 示例（可选）：
```bash
npm run dev:agent
```
