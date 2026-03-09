# Simple HTTP MCP Server

一个简单的 HTTP MCP 服务器，支持基本的工具调用。

## 快速启动

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务器
python src/server.py
```

服务器将运行在 http://localhost:8000

## 测试

```bash
# 获取服务器信息
curl http://localhost:8000/mcp/info

# 列出工具
curl http://localhost:8000/mcp/tools

# 调用工具
curl -X POST http://localhost:8000/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"name": "add", "arguments": {"a": 10, "b": 20}}'
```
