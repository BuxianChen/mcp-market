# SSE MCP Server - Python 实现

这是一个使用 SSE (Server-Sent Events) 传输协议的 MCP 服务器示例。

## 功能特性

### 计算器工具
- `add`: 两数相加
- `subtract`: 两数相减
- `multiply`: 两数相乘
- `divide`: 两数相除

### 天气工具
- `get_weather`: 获取城市天气信息（模拟数据）

### 文本处理工具
- `to_upper_case`: 转换为大写
- `to_lower_case`: 转换为小写
- `reverse_text`: 反转文本
- `word_count`: 统计单词数

## 安装

```bash
pip install -r requirements.txt
```

## 运行

```bash
# 方式 1: 直接运行
python -m src.server

# 方式 2: 使用 uvicorn
uvicorn src.server:app --host 0.0.0.0 --port 3001
```

服务器将在 `http://localhost:3001` 启动。

## 端点

- **MCP 端点**: `http://localhost:3001/mcp` (SSE)
- **消息端点**: `http://localhost:3001/messages/` (POST)
- **健康检查**: `http://localhost:3001/health` (GET)

## 在 MCP Market 中使用

1. 打开 MCP Market Web 界面
2. 点击"添加 MCP 服务器"
3. 填写配置：
   - **名称**: SSE Example Server
   - **连接类型**: SSE
   - **URL**: `http://localhost:3001/mcp`
4. 点击"测试连接"
5. 使用"交互式测试"功能测试工具

## SSE vs STDIO

### SSE 优势
- ✅ 支持 HTTP 协议，易于部署
- ✅ 可以通过网络访问
- ✅ 支持多客户端连接
- ✅ 自动重连机制
- ✅ 适合 Web 应用

### STDIO 优势
- ✅ 更简单，无需网络配置
- ✅ 适合本地工具
- ✅ 更低的延迟

## 测试示例

### 使用 curl 测试健康检查
```bash
curl http://localhost:3001/health
```

### 使用 MCP Market 测试工具调用
在交互式测试界面中：

**计算器**:
```json
{
  "tool": "add",
  "arguments": {
    "a": 10,
    "b": 20
  }
}
```

**天气查询**:
```json
{
  "tool": "get_weather",
  "arguments": {
    "city": "Beijing"
  }
}
```

## 代码结构

```
sse-server/python/
├── src/
│   ├── __init__.py
│   ├── server.py          # 主服务器文件
│   └── tools/             # 工具实现
│       ├── __init__.py
│       ├── calculator.py  # 计算器工具
│       ├── weather.py     # 天气工具
│       └── text_utils.py  # 文本工具
├── requirements.txt
└── README.md
```

## 核心实现

```python
# 1. 创建 MCP 服务器
mcp_server = Server("example-mcp-server")

# 2. 创建 SSE 传输层
sse = SseServerTransport("/messages/")

# 3. SSE 端点处理
async def handle_sse(request):
    async with sse.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        await mcp_server.run(streams[0], streams[1], ...)

# 4. 创建 Starlette 应用
app = Starlette(
    routes=[
        Route("/mcp", endpoint=handle_sse, methods=["GET"]),
        Mount("/messages/", app=sse.handle_post_message),
    ]
)
```

## 扩展开发

### 添加新工具模块

1. 在 `src/tools/` 创建新文件：
```python
# src/tools/my_tool.py
def my_function(param: str) -> str:
    return f"Result: {param}"
```

2. 在 `server.py` 中导入并注册：
```python
from .tools import my_tool

# 在 list_tools() 中添加
Tool(
    name="my_function",
    description="My custom function",
    inputSchema={...}
)

# 在 call_tool() 中处理
elif name == "my_function":
    result = my_tool.my_function(arguments["param"])
```

### 添加 CORS 配置

已包含 CORS 中间件，允许所有来源访问：
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

生产环境建议限制 `allow_origins`。

## 部署建议

### 使用 systemd
```ini
[Unit]
Description=MCP SSE Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/sse-server/python
ExecStart=/usr/bin/python3 -m src.server
Restart=always

[Install]
WantedBy=multi-user.target
```

### 使用 Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY src/ ./src/
CMD ["python", "-m", "src.server"]
```

## 相关资源

- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Starlette 文档](https://www.starlette.io/)
- [SSE 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [返回上级目录](../)
