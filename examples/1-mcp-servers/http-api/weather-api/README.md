# Weather API - HTTP 转 MCP 示例

这是一个简单的 HTTP REST API，用于演示如何将现有 HTTP API 转换为 MCP 工具。

## 功能特性

### API 端点

- `GET /health` - 健康检查
- `GET /api/weather/<city>` - 获取指定城市天气
- `GET /api/weather?city=<city>` - 通过查询参数获取天气
- `GET /api/cities` - 列出所有可用城市
- `POST /api/weather/batch` - 批量获取多个城市天气

### 支持的城市

- Beijing (北京)
- Shanghai (上海)
- Guangzhou (广州)
- Shenzhen (深圳)

## 安装

```bash
pip install -r requirements.txt
```

## 运行

```bash
python server.py
```

API 将在 `http://localhost:5000` 启动。

## 测试 API

### 获取单个城市天气
```bash
curl http://localhost:5000/api/weather/beijing
```

响应：
```json
{
  "success": true,
  "data": {
    "city": "Beijing",
    "temperature": 15,
    "condition": "Sunny",
    "humidity": 45,
    "wind_speed": 12,
    "last_updated": "2024-03-09T10:00:00Z"
  }
}
```

### 列出所有城市
```bash
curl http://localhost:5000/api/cities
```

### 批量查询
```bash
curl -X POST http://localhost:5000/api/weather/batch \
  -H "Content-Type: application/json" \
  -d '{"cities": ["beijing", "shanghai"]}'
```

## 配置 HTTP 转 MCP

在 MCP Market 中将此 API 转换为 MCP 工具：

### 1. 创建 HTTP 类型的 MCP 服务器

在 MCP Market Web 界面：
- 名称: Weather API
- 连接类型: HTTP
- URL: `http://localhost:5000`

### 2. 配置映射

点击"配置映射"按钮，添加以下工具映射：

#### 工具 1: get_weather
```json
{
  "toolName": "get_weather",
  "description": "获取指定城市的天气信息",
  "httpMethod": "GET",
  "httpPath": "/api/weather/{city}",
  "parameters": {
    "city": {
      "type": "string",
      "description": "城市名称（英文）",
      "location": "path",
      "required": true
    }
  },
  "responseMapping": {
    "success": "$.success",
    "data": "$.data"
  }
}
```

#### 工具 2: list_cities
```json
{
  "toolName": "list_cities",
  "description": "列出所有可用城市",
  "httpMethod": "GET",
  "httpPath": "/api/cities",
  "parameters": {},
  "responseMapping": {
    "cities": "$.data.cities",
    "total": "$.data.total"
  }
}
```

#### 工具 3: get_weather_batch
```json
{
  "toolName": "get_weather_batch",
  "description": "批量获取多个城市的天气信息",
  "httpMethod": "POST",
  "httpPath": "/api/weather/batch",
  "parameters": {
    "cities": {
      "type": "array",
      "description": "城市名称列表",
      "location": "body",
      "required": true
    }
  },
  "responseMapping": {
    "results": "$.data.results"
  }
}
```

### 3. 测试 MCP 工具

在交互式测试界面中：

**获取天气**:
```json
{
  "tool": "get_weather",
  "arguments": {
    "city": "beijing"
  }
}
```

**列出城市**:
```json
{
  "tool": "list_cities",
  "arguments": {}
}
```

**批量查询**:
```json
{
  "tool": "get_weather_batch",
  "arguments": {
    "cities": ["beijing", "shanghai"]
  }
}
```

## HTTP 转 MCP 的优势

1. **无需修改现有 API**：直接将现有 HTTP API 转换为 MCP 工具
2. **灵活的映射配置**：支持路径参数、查询参数、请求体
3. **响应数据提取**：使用 JSONPath 提取需要的数据
4. **统一接口**：AI Agent 通过统一的 MCP 协议访问

## 扩展示例

### 添加认证

```python
from functools import wraps

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != 'your-secret-key':
            return jsonify({"error": "Invalid API key"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/weather/<city>')
@require_api_key
def get_weather(city):
    # ...
```

在 MCP Market 中配置 HTTP Headers：
```json
{
  "X-API-Key": "your-secret-key"
}
```

### 添加速率限制

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/api/weather/<city>')
@limiter.limit("10 per minute")
def get_weather(city):
    # ...
```

## 相关资源

- [Flask 文档](https://flask.palletsprojects.com/)
- [JSONPath 语法](https://goessner.net/articles/JsonPath/)
- [HTTP 转 MCP 配置示例](../../../4-http-to-mcp/)
- [返回上级目录](../)
