# Backend Python Tests

使用 `requests` 库测试 backend_python 的 API 接口。

## 测试结构

```
tests/
├── __init__.py
├── test_mcp_api.py          # MCP Server CRUD 操作测试
├── test_connection.py       # 连接测试
├── test_session.py          # 会话管理测试
└── test_operations.py       # MCP 操作测试（tool/resource/prompt）
```

## 运行测试

### 前置条件

1. 启动 backend_python 服务：
```bash
cd backend_python
uv run uvicorn src.main:app --host 0.0.0.0 --port 3000
```

2. （可选）启动一个测试用的 MCP Server：
```bash
# 例如使用 verified_examples 中的示例
cd verified_examples/mcp-servers/python/streamable-http/simple-streamablehttp
python main.py
```

### 运行所有测试

```bash
cd backend_python
uv run pytest tests/ -v
```

### 运行单个测试文件

```bash
# CRUD 测试
uv run pytest tests/test_mcp_api.py -v

# 连接测试
uv run pytest tests/test_connection.py -v

# 会话测试
uv run pytest tests/test_session.py -v

# 操作测试
uv run pytest tests/test_operations.py -v
```

### 运行特定测试

```bash
uv run pytest tests/test_mcp_api.py::TestMcpCRUD::test_create_mcp_server -v
```

## 测试说明

### test_mcp_api.py
测试 MCP Server 的 CRUD 操作：
- 创建 MCP Server（stdio/sse/http 类型）
- 获取所有 MCP Server
- 获取单个 MCP Server
- 更新 MCP Server
- 删除 MCP Server
- 错误处理（不存在的资源）

### test_connection.py
测试 MCP Server 连接：
- 测试连接真实的 MCP Server
- 自定义超时参数
- 不同连接类型（stdio/http）
- 响应结构验证

### test_session.py
测试会话管理：
- 创建会话
- 获取会话信息
- 关闭会话
- 多会话管理
- 错误处理

### test_operations.py
测试 MCP 操作：
- 调用 Tool
- 读取 Resource
- 获取 Prompt
- 参数验证
- 错误处理

## 注意事项

1. 部分测试需要真实的 MCP Server 运行才能完全通过
2. 如果 MCP Server 未运行，某些测试会被跳过（pytest.skip）
3. 测试会自动清理创建的资源（teardown_method）
4. 可以根据实际的 MCP Server 调整测试数据
