# Path Prefix 功能实现总结

## 功能说明

实现了 MCP Server 的路径前缀（path_prefix）功能，允许将原始 MCP 服务地址转换为统一的代理地址：

**转换示例：**
- 原始地址：`http://10.23.56.64:8000/mcp` → 代理地址：`http://localhost:3000/weather/mcp`
- 原始地址：`http://10.23.56.63:8000/mcp` → 代理地址：`http://localhost:3000/time/mcp`

其中 `weather` 和 `time` 是每个 MCP Server 的唯一路径前缀。

## 实现的文件

### 后端 (backend_python)

#### 1. 数据库层
- **src/db/schema.sql** - 添加 `path_prefix TEXT UNIQUE` 字段和索引
- **src/db/migrate.py** - 数据库迁移脚本，自动为已有数据生成 path_prefix

#### 2. 类型定义
- **src/types/mcp.py**
  - `McpServerBase`: 添加 `path_prefix` 字段，带格式验证（正则：`^[a-z0-9-]+$`，长度 3-50）
  - `McpServerUpdate`: 添加 `path_prefix` 字段
  - `McpServer`: 继承自 Base，自动包含 path_prefix

#### 3. 服务层
- **src/services/mcp_service.py**
  - `create()`: 支持创建时设置 path_prefix
  - `update()`: 支持更新 path_prefix
  - `get_by_path_prefix()`: 新增方法，通过 path_prefix 查询服务器
  - `_row_to_server()`: 添加 path_prefix 字段映射

#### 4. 路由层
- **src/routes/proxy_path.py** - 新建文件，实现基于 path_prefix 的动态代理
  - 路由：`/{path_prefix}/{path:path}`
  - 支持所有 HTTP 方法（GET, POST, PUT, DELETE, PATCH, OPTIONS）
  - 保留关键字检查（api, admin, proxy, health, docs）
  - 仅支持 http/sse 类型服务器
  - 完整转发请求（headers, body, query params）
  - 错误处理（超时、连接失败等）

- **src/main.py** - 注册 proxy_path 路由（必须最后注册，作为兜底路由）

### 前端 (frontend)

#### 1. 类型定义
- **src/types/mcp.ts**
  - `McpServer`: 添加 `path_prefix?: string | null`
  - `CreateMcpServerInput`: 添加 `path_prefix?: string`

#### 2. 表单组件
- **src/components/AddMcpForm.tsx**
  - 添加 `pathPrefix` 状态管理
  - 添加路径前缀输入框（仅 HTTP/SSE 类型显示）
  - 自动转小写
  - 客户端验证（pattern, minLength, maxLength）
  - 提交时包含 path_prefix

#### 3. 展示组件
- **src/components/McpCard.tsx**
  - 显示代理地址（仅当 path_prefix 存在且类型为 http/sse）
  - 提供复制按钮
  - 美化样式（蓝色背景框）

### 测试代码 (backend_python/tests)

#### 1. 单元测试
- **test_path_prefix.py** - 测试 path_prefix 的 CRUD 操作
  - 创建带 path_prefix 的服务器
  - 唯一性约束测试
  - 格式验证测试
  - 更新 path_prefix
  - 可选字��测试

#### 2. 集成测试
- **test_proxy_path.py** - 测试路径代理功能
  - 通过 path_prefix 代理请求
  - 不存在的 path_prefix 返回 404
  - stdio 类型返回 400 错误
  - 保留关键字测试
  - 不同 HTTP 方法测试
  - 嵌套路径测试

#### 3. 测试指南
- **TEST_GUIDE.md** - 完整的测试步骤和验证要点

### 文档

- **API.md** - 更新 API 文档
  - 添加 path_prefix 字段说明
  - 添加路径代理接口文档
  - 更新数据模型定义

## 关键设计决策

### 1. 数据库设计
- `path_prefix` 字段为可选（允许 NULL）
- 添加 UNIQUE 约束，确保全局唯一
- 添加索引，优化查询性能

### 2. 格式验证
- 仅允许小写字母、数字、连字符
- 长度限制：3-50 字符
- 前后端双重验证

### 3. 路由优先级
```
/api/mcps/*          (最高优先级 - 管理 API)
/api/proxy/*         (中等优先级 - Token 认证代理)
/{path_prefix}/*     (最低优先级 - 路径前缀代理)
```

### 4. 保留关键字
防止用户使用系统路径作为 path_prefix：
- api, admin, proxy, health, docs, redoc, openapi.json

### 5. 类型限制
- 仅 http 和 sse 类型支持路径代理
- stdio 类型设置 path_prefix 后访问会返回 400 错误

### 6. 请求转发
- 完整转发 HTTP 方法、headers、body、query params
- 排除 hop-by-hop headers（host, connection, transfer-encoding）
- 使用 httpx.AsyncClient 实现异步转发
- 支持自定义超时配置

## 使用示例

### 1. 创建带 path_prefix 的服务器

```bash
curl -X POST http://localhost:3000/api/mcps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weather Server",
    "connection_type": "http",
    "connection_config": {
      "url": "http://10.23.56.64:8000/mcp"
    },
    "path_prefix": "weather"
  }'
```

### 2. 通过路径前缀访问

```bash
curl http://localhost:3000/weather/mcp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}'
```

### 3. 前端使用

1. 打开添加 MCP Server 表单
2. 选择连接类型为 HTTP 或 SSE
3. 填写 URL：`http://10.23.56.64:8000/mcp`
4. 填写路径前缀：`weather`
5. 提交后，在卡片中会显示代理地址：`http://localhost:3000/weather/mcp`

## 部署步骤

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

### 3. 启动前端服务

```bash
cd frontend
npm run dev
```

### 4. 运行测试

```bash
cd backend_python
uv run pytest tests/ -v
```

## 验证清单

- [x] 数据库 schema 添加 path_prefix 字段
- [x] 数据库迁移脚本创建完成
- [x] 后端类型定义更新
- [x] 后端服务层支持 CRUD
- [x] 路径代理路由实现
- [x] 前端类型定义更新
- [x] 前端表单添加输入框
- [x] 前端卡片显示代理地址
- [x] 单元测试编写完成
- [x] 集成测试编写完成
- [x] API 文档更新
- [x] 测试指南编写完成

## 注意事项

1. **数据库迁移**：首次部署需要运行迁移脚本
2. **路由顺序**：proxy_path 路由必须最后注册
3. **保留关键字**：避免使用系统路径作为 path_prefix
4. **类型限制**：stdio 类型不支持路径代理
5. **唯一性**：path_prefix 必须全局唯一
6. **格式验证**：仅支持小写字母、数字、连字符

## 未来优化建议

1. **配置化代理地址**：将 `http://localhost:3000` 改为从配置文件读取
2. **批量导入**：支持批量创建 MCP Server 并自动生成 path_prefix
3. **路径冲突检测**：在创建前检测 path_prefix 是否与现有路由冲突
4. **监控和日志**：记录代理请求的访问日志和性能指标
5. **负载均衡**：支持同一 path_prefix 对应多个上游服务器
