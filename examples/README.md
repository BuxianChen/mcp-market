# MCP Market Examples

本目录包含 MCP Market 的各种示例代码和配置，帮助你快速上手。

## 📚 目录结构

### 1️⃣ [MCP Servers](./1-mcp-servers/) - MCP 服务器开发
学习如何开发不同类型的 MCP 服务器：
- **STDIO Server**: 标准输入输出通信的服务器
- **SSE Server**: Server-Sent Events 流式服务器
- **HTTP API**: 用于 HTTP 转 MCP 的 REST API

支持 Python 和 Node.js 双语言实现。

### 2️⃣ [MCP Clients](./2-mcp-clients/) - MCP 客户端使用
学习如何连接和使用 MCP 服务器：
- **Basic Client**: 基础客户端连接示例
- **Proxy Client**: 通过代理层访问 MCP 服务器

### 3️⃣ [Agent Integration](./3-agent-integration/) - AI Agent 集成
将 MCP 服务器集成到 AI Agent 中：
- **Simple Agent**: 简单的 Agent 实现
- **DeepSeek Agent**: DeepSeek 模型集成
- **LangChain Agent**: LangChain 框架集成

### 4️⃣ [HTTP to MCP](./4-http-to-mcp/) - HTTP 转 MCP 配置
将现有 HTTP API 转换为 MCP 工具：
- 天气 API 映射示例
- GitHub API 映射示例
- OpenAI API 映射示例
- 自定义 API 模板

### 5️⃣ [Deployment](./5-deployment/) - 部署指南
生产环境部署方案：
- Docker / Docker Compose
- Kubernetes
- Systemd 服务

## 🚀 快速开始

### 1. 开发你的第一个 MCP Server

```bash
cd 1-mcp-servers/stdio-server/python
pip install -r requirements.txt
python server.py
```

### 2. 测试 MCP Server

```bash
cd 2-mcp-clients/python-client
pip install -r requirements.txt
python basic_client.py
```

### 3. 配置 HTTP 转 MCP

在 MCP Market Web 界面中：
1. 创建一个 HTTP 类型的 MCP 服务器
2. 点击"配置映射"按钮
3. 参考 `4-http-to-mcp/` 目录中的配置示例

### 4. 部署到生产��境

```bash
cd 5-deployment/docker
docker-compose up -d
```

## 📖 学习路径

**初学者**：
1. 阅读 [1-mcp-servers/README.md](./1-mcp-servers/README.md) 了解 MCP 协议
2. 运行 STDIO Server 示例
3. 运行 Basic Client 连接测试

**进阶用户**：
1. 学习 HTTP 转 MCP 功能
2. 集成到 AI Agent 中
3. 使用代理层和 Token 认证

**生产部署**：
1. 阅读部署指南
2. 配置监控和日志
3. 设置备份和恢复

## 🔗 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/sdk)
- [项目主 README](../README.md)

## 💡 贡献示例

欢迎贡献新的示例！请确保：
- 代码简洁易懂
- 包含完整的 README
- 提供依赖清单
- ���加必要的注释
