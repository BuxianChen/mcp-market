# STDIO MCP Server - Python 实现

这是一个使用 STDIO 传输协议的 MCP 服务器示例。

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
python server.py
```

服务器将通过标准输入输出与客户端通信。

## 在 MCP Market 中使用

1. 打开 MCP Market Web 界面
2. 点击"添加 MCP 服务器"
3. 填写配置：
   - **名称**: STDIO Example Server
   - **连接类型**: STDIO
   - **命令**: `python /path/to/server.py`
   - **工作目录**: `/path/to/examples/1-mcp-servers/stdio-server/python`
4. 点击"测试连接"
5. 使用"交互式测试"功能测试工具

## 测试示例

### 计算器
```json
{
  "tool": "add",
  "arguments": {
    "a": 10,
    "b": 20
  }
}
```

### 天气查询
```json
{
  "tool": "get_weather",
  "arguments": {
    "city": "Beijing"
  }
}
```

### 文本处理
```json
{
  "tool": "to_upper_case",
  "arguments": {
    "text": "hello world"
  }
}
```

## 代码结构

```python
# 1. 创建服务器实例
server = Server("stdio-example-server")

# 2. 注册工具列表
@server.list_tools()
async def list_tools() -> list[Tool]:
    return [...]

# 3. 处理工具调用
@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    # 执行工具逻辑
    return [TextContent(type="text", text=result)]

# 4. 启动 STDIO 服务器
async with stdio_server() as (read_stream, write_stream):
    await server.run(read_stream, write_stream, ...)
```

## 扩展开发

### 添加新工具

1. 实现工具函数：
```python
def my_tool(param: str) -> str:
    return f"Result: {param}"
```

2. 在 `list_tools()` 中注册：
```python
Tool(
    name="my_tool",
    description="My custom tool",
    inputSchema={
        "type": "object",
        "properties": {
            "param": {"type": "string"}
        },
        "required": ["param"]
    }
)
```

3. 在 `call_tool()` 中处理：
```python
elif name == "my_tool":
    result = my_tool(arguments["param"])
```

## 相关资源

- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [返回上级目录](../)
