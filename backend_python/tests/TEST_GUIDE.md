# Path Prefix 功能测试指南

## 功能说明

path_prefix 功能允许为每个 MCP Server 配置唯一的路径前缀，实现地址转换：

- 原始地址：`http://10.23.56.64:8000/mcp`
- 代理地址：`http://localhost:3000/weather/mcp`

## 测试步骤

### 1. 运行数据库迁移

```bash
cd backend_python
python src/db/migrate.py mcp_market.db
```

### 2. 启动后端服务

```bash
cd backend_python
uv run uvicorn src.main:app --host 0.0.0.0 --port 3000
```

### 3. 测试创建带 path_prefix 的服务器

```bash
curl -X POST http://localhost:3000/api/mcps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weather Server",
    "description": "Test weather server",
    "connection_type": "http",
    "connection_config": {
      "url": "http://localhost:8000/mcp"
    },
    "path_prefix": "weather"
  }'
```

### 4. 测试路径代理

```bash
# 通过路径前缀访问
curl http://localhost:3000/weather/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}'
```

### 5. 运行自动化测试

```bash
cd backend_python

# 测试 path_prefix CRUD
uv run pytest tests/test_path_prefix.py -v

# 测试路径代理
uv run pytest tests/test_proxy_path.py -v

# 运行所有测试
uv run pytest tests/ -v
```

## 前端测试

1. 启动前端：
```bash
cd frontend
npm run dev
```

2. 打开浏览器访问 http://localhost:5173

3. 测试步骤：
   - 点击"添加 MCP Server"
   - 选择连接类型为 HTTP 或 SSE
   - 填写 URL
   - 填写路径前缀（如 "weather"）
   - 提交表单
   - 在卡片中查看生成的代理地址
   - 点击"复制"按钮测试复制功能

## 验证要点

- [ ] 数据库迁移成功，path_prefix 列已添加
- [ ] 可以创建带 path_prefix 的服务器
- [ ] path_prefix 必须唯一（重复会报错）
- [ ] path_prefix 格式验证正确（仅小写字母、数字、连字符）
- [ ] 通过 /{path_prefix}/mcp 可以访问服务
- [ ] stdio 类型服务器设置 path_prefix 后，通过路径访问会返回 400 错误
- [ ] 前端表单正确显示和提交 path_prefix
- [ ] 前端卡片正确显示代理地址
- [ ] 测试用例全部通过
