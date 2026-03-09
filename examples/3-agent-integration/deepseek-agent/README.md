# DeepSeek MCP Agent

使用 DeepSeek API 的生产级 MCP Agent 实现，支持完整的工具调用和多轮对话。

## 功能特性

- ✅ 使用 DeepSeek API 进行意图理解
- ✅ 完整的 Function Calling 支持
- ✅ 多轮对话和上下文管理
- ✅ 自动工具选择和调用
- ✅ 错误处理和重试机制
- ✅ 流式响应支持

## 架构说明

DeepSeek Agent 使用真实的 LLM 来理解用户意图并选择合适的工具。它支持：

1. **智能工具选择** - LLM 自动选择最合适的工具
2. **多轮对话** - 支持连续的工具调用
3. **上下文管理** - 维护对话历史
4. **并行调用** - 同时执行多个工具

### Agent 工作流程

```
用户输入
    ↓
DeepSeek LLM 分析
    ↓
选择工具（可能多个）
    ↓
并行调用 MCP 工具
    ↓
LLM 处理结果
    ↓
生成自然语言响应
```

## 前置条件

1. DeepSeek API Key（从 https://platform.deepseek.com/ 获取）
2. MCP Market 后端运行在 `http://localhost:3000`
3. 至少配置一个 MCP 服务器

## 安装

```bash
pip install -r requirements.txt
```

## 配置

设置环境变量：

```bash
export DEEPSEEK_API_KEY="your-api-key"
export MCP_PROXY_URL="http://localhost:3000"  # 可选，默认值
```

或在代码中配置：

```python
agent = DeepSeekAgent(
    api_key="your-deepseek-api-key",
    mcp_proxy_url="http://localhost:3000"
)
```

## 使用示例

### 基础使用

```python
from deepseek_agent import DeepSeekAgent
import asyncio

async def main():
    agent = DeepSeekAgent(api_key="your-api-key")
    await agent.initialize()

    response = await agent.run("北京的天气怎么样？")
    print(response)

    await agent.close()

asyncio.run(main())
```

### 多轮对话

```python
agent = DeepSeekAgent(api_key="your-api-key")
await agent.initialize()

# 第一轮
response1 = await agent.run("北京的天气怎么样？")
print(response1)

# 第二轮（带上下文）
response2 = await agent.run("那上海呢？")
print(response2)

# 第三轮
response3 = await agent.run("帮我比较一下这两个城市的温度")
print(response3)
```

### 复杂任务

```python
# Agent 会自动分解任务并调用多个工具
response = await agent.run(
    "查询北京和上海的天气，然后计算它们的平均温度"
)
```

### 流式响应

```python
async for chunk in agent.run_stream("讲个笑话"):
    print(chunk, end="", flush=True)
```

## API 文档

### DeepSeekAgent

#### `__init__(api_key, mcp_proxy_url, model, server_id)`

创建 DeepSeek Agent 实例。

**参数**:
- `api_key` (str): DeepSeek API 密钥
- `mcp_proxy_url` (str): MCP Market 代理地址，默认 "http://localhost:3000"
- `model` (str): 模型名称，默认 "deepseek-chat"
- `server_id` (str, optional): MCP 服务器 ID，默认使用第一个可用服务器

#### `async initialize()`

初始化 Agent，加载 MCP 工具。

```python
await agent.initialize()
```

#### `async run(user_input, max_iterations=5) -> str`

处理用户输入并返回响应。

**参数**:
- `user_input` (str): 用户输入
- `max_iterations` (int): 最大工具调用轮数，默认 5

**返回**:
- `str`: Agent 响应

```python
response = await agent.run("帮我查询天气")
```

#### `async run_stream(user_input, max_iterations=5)`

流式处理用户输入。

**参数**:
- `user_input` (str): 用户输入
- `max_iterations` (int): 最大工具调用轮数

**Yields**:
- `str`: 响应片段

```python
async for chunk in agent.run_stream("讲个故事"):
    print(chunk, end="")
```

#### `reset_conversation()`

重置对话历史。

```python
agent.reset_conversation()
```

#### `async close()`

关闭 Agent 连接。

```python
await agent.close()
```

## 高级用法

### 自定义系统提示

```python
class CustomAgent(DeepSeekAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.system_prompt = """
        你是一个专业的数据分析助手。
        你可以使用提供的工具来查询数据、进行计算和生成报告。
        请始终保持专业和准确。
        """
```

### 添加工具过滤

```python
class FilteredAgent(DeepSeekAgent):
    async def initialize(self):
        await super().initialize()
        # 只使用特定的工具
        self.tools = [t for t in self.tools if t["name"] in ["get_weather", "add"]]
```

### 结果后处理

```python
class PostProcessAgent(DeepSeekAgent):
    async def run(self, user_input):
        response = await super().run(user_input)
        # 添加自定义后处理
        return self.post_process(response)

    def post_process(self, response):
        # 格式化、翻译、添加元数据等
        return f"[处理完成] {response}"
```

### 错误重试

```python
async def run_with_retry(agent, user_input, max_retries=3):
    for i in range(max_retries):
        try:
            return await agent.run(user_input)
        except Exception as e:
            if i == max_retries - 1:
                raise
            print(f"重试 {i+1}/{max_retries}...")
            await asyncio.sleep(1)
```

## 工具转换

DeepSeek Agent 自动将 MCP 工具转换为 DeepSeek Function Calling 格式：

```python
# MCP 工具格式
{
    "name": "get_weather",
    "description": "获取城市天气",
    "inputSchema": {
        "type": "object",
        "properties": {
            "city": {"type": "string"}
        },
        "required": ["city"]
    }
}

# 转换为 DeepSeek 格式
{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "获取城市天气",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string"}
            },
            "required": ["city"]
        }
    }
}
```

## 性能优化

### 1. 工具缓存

```python
agent = DeepSeekAgent(api_key="...")
await agent.initialize()  # 只初始化一次

# 多次使用
for query in queries:
    response = await agent.run(query)
```

### 2. 并行处理

```python
async def process_batch(agent, queries):
    tasks = [agent.run(q) for q in queries]
    return await asyncio.gather(*tasks)
```

### 3. 连接复用

```python
# 使用同一个 agent 实例处理多个请求
agent = DeepSeekAgent(api_key="...")
await agent.initialize()

try:
    while True:
        user_input = input("You: ")
        response = await agent.run(user_input)
        print(f"Agent: {response}")
finally:
    await agent.close()
```

## 示例场景

### 场景 1: 智能助手

```python
# 用户: "帮我查询北京的天气，如果温度低于 10 度就提醒我"
# Agent 会:
# 1. 调用 get_weather 工具
# 2. 分析温度
# 3. 生成提醒（如果需要）
```

### 场景 2: 数据分析

```python
# 用户: "分析最近一周的销售数据并生成报告"
# Agent 会:
# 1. 调用 query_database 工具
# 2. 调用 analyze_data 工具
# 3. 调用 generate_report 工具
# 4. 返回完整报告
```

### 场景 3: 自动化任务

```python
# 用户: "每天早上 9 点发送天气预报到我的邮箱"
# Agent 会:
# 1. 创建定时任务
# 2. 配置 get_weather 和 send_email 工具
# 3. 返回确认信息
```

## 调试

启用详细日志：

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("deepseek_agent")
logger.setLevel(logging.DEBUG)
```

查看工具调用：

```python
agent = DeepSeekAgent(api_key="...", verbose=True)
```

## 限制

1. **API 限制** - 受 DeepSeek API 速率限制约束
2. **上下文长度** - 受模型上下文窗口限制
3. **工具数量** - 建议不超过 20 个工具以保证性能

## 相关资源

- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [Simple Agent 示例](../simple-agent/)
- [LangChain Agent 示例](../langchain-agent/)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [返回上级目录](../)

## 注意事项

> **注意**: 本示例需要 DeepSeek API Key。如果您还没有，请访问 https://platform.deepseek.com/ 注册并获取。

> **提示**: 如果您想使用其他 LLM（如 OpenAI、Anthropic），可以参考此实现并修改 API 调用部分。
