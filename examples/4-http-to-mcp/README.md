# HTTP 转 MCP 配置示例

本目录包含将 HTTP API 转换为 MCP 工具的配置示例。

## 📚 配置示例

- [weather-api-mapping.json](./weather-api-mapping.json) - 天气 API 映射
- [github-api-mapping.json](./github-api-mapping.json) - GitHub API 映射
- [openai-api-mapping.json](./openai-api-mapping.json) - OpenAI API 映射
- [custom-api-template.json](./custom-api-template.json) - 自定义 API 模板

## 🎯 快速开始

### 1. 在 MCP Market 中创建 HTTP 服务器

1. 打开 MCP Market Web 界面
2. 点击"添加 MCP 服务器"
3. 选择连接类型: HTTP
4. 填写基础 URL（例如: `http://localhost:5000`）

### 2. 配置 HTTP 映射

1. 点击服务器卡片的"配置映射"按钮
2. 参考本目录中的配置示例
3. 填写工具名称、HTTP 方法、路径等
4. 配置参数和响应映射
5. 保存配置

### 3. 测试工具

使用"交互式测试"功能测试配置的工具。

## 📖 配置格式说明

### 基本结构

```json
{
  "toolName": "tool_name",
  "description": "工具描述",
  "httpMethod": "GET|POST|PUT|DELETE",
  "httpPath": "/api/path/{param}",
  "parameters": {
    "param_name": {
      "type": "string|number|boolean|array|object",
      "description": "参数描述",
      "location": "path|query|body|header",
      "required": true|false
    }
  },
  "responseMapping": {
    "field_name": "$.jsonpath.expression"
  }
}
```

### 参数位置 (location)

- **path**: URL 路径参数 `/api/users/{userId}`
- **query**: URL 查询参数 `/api/users?name=john`
- **body**: 请求体参数（POST/PUT）
- **header**: HTTP 头部参数

### 响应映射 (responseMapping)

使用 JSONPath 表达式提取响应数据：

- `$.data` - 提取根对象的 data 字段
- `$.data.items[*]` - 提取数组中的所有元素
- `$.data.user.name` - 提取嵌套对象的字段

## 💡 示例场景

### 场景 1: RESTful API

将标准的 REST API 转换为 MCP 工具：

```json
{
  "toolName": "get_user",
  "description": "获取用户信息",
  "httpMethod": "GET",
  "httpPath": "/api/users/{userId}",
  "parameters": {
    "userId": {
      "type": "string",
      "description": "用户 ID",
      "location": "path",
      "required": true
    }
  },
  "responseMapping": {
    "user": "$.data"
  }
}
```

### 场景 2: 查询参数

使用查询参数的 API：

```json
{
  "toolName": "search_users",
  "description": "搜索用户",
  "httpMethod": "GET",
  "httpPath": "/api/users",
  "parameters": {
    "keyword": {
      "type": "string",
      "description": "搜索关键词",
      "location": "query",
      "required": true
    },
    "limit": {
      "type": "number",
      "description": "返回数量限制",
      "location": "query",
      "required": false
    }
  },
  "responseMapping": {
    "users": "$.data.items",
    "total": "$.data.total"
  }
}
```

### 场景 3: POST 请求

带请求体的 POST 请求：

```json
{
  "toolName": "create_user",
  "description": "创建新用户",
  "httpMethod": "POST",
  "httpPath": "/api/users",
  "parameters": {
    "name": {
      "type": "string",
      "description": "用户名",
      "location": "body",
      "required": true
    },
    "email": {
      "type": "string",
      "description": "邮箱",
      "location": "body",
      "required": true
    }
  },
  "responseMapping": {
    "userId": "$.data.id",
    "success": "$.success"
  }
}
```

### 场景 4: 认证头部

需要认证的 API：

```json
{
  "toolName": "get_protected_data",
  "description": "获取受保护的数据",
  "httpMethod": "GET",
  "httpPath": "/api/protected",
  "parameters": {
    "apiKey": {
      "type": "string",
      "description": "API 密钥",
      "location": "header",
      "required": true
    }
  },
  "responseMapping": {
    "data": "$.data"
  }
}
```

## 🔧 高级用法

### 复杂的 JSONPath 表达式

```json
{
  "responseMapping": {
    // 提取数组第一个元素
    "first_item": "$.data.items[0]",

    // 提取所有名称
    "names": "$.data.items[*].name",

    // 条件过滤
    "active_users": "$.data.items[?(@.status=='active')]",

    // 嵌套提取
    "user_emails": "$.data.users[*].profile.email"
  }
}
```

### 多参数组合

```json
{
  "parameters": {
    "userId": {
      "type": "string",
      "location": "path",
      "required": true
    },
    "includeDetails": {
      "type": "boolean",
      "location": "query",
      "required": false
    },
    "authorization": {
      "type": "string",
      "location": "header",
      "required": true
    },
    "metadata": {
      "type": "object",
      "location": "body",
      "required": false
    }
  }
}
```

## 📝 最佳实践

1. **清晰的工具命名**: 使用动词+名词格式（get_user, create_order）
2. **详细的描述**: 帮助 AI 理解工具用途
3. **合理的参数设计**: 只暴露必要的参数
4. **精确的响应映射**: 只提取需要的数据
5. **错误处理**: 考虑 API 错误响应的处理

## 🔗 相关资源

- [JSONPath 在线测试](https://jsonpath.com/)
- [HTTP API 示例](../1-mcp-servers/http-api/)
- [MCP 协议文档](https://modelcontextprotocol.io/)

## 💡 下一步

1. 查看具体的配置示例文件
2. 运行 HTTP API 示例服务器
3. 在 MCP Market 中配置映射
4. 使用交互式测试验证配置
