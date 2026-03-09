# Simple MCP Agent

一个简单的 AI Agent 实现，展示如何集成 MCP 工具的基本模式。

## 功能特性

- ✅ 自动加载 MCP 工具
- ✅ 简单的意图识别（基于关键词）
- ✅ 工具调用和结果处理
- ✅ 对话历史管理
- ✅ 交互式对话模式

## 架构说明

这是一个教学示例，使用简化的意图识别（关键词匹配）来演示 Agent 的基本工作流程。在生产环境中，应该使用真实的 LLM 来进行意图理解和响应生成。

### Agent 工作流程

```
用户输入
    ↓
意图解析（关键词匹配）
    ↓
选择工具和参数
    ↓
调用 MCP 工具
    ↓
生成响应
    ↓
返回结果
```

## 前置条件

1. MCP Market 后端运行在 `http://localhost:3000`
2. 至少配置一个 MCP 服务器（如 STDIO 服务器）

```bash
# 启动后端
cd ../../../backend
npm run dev

# 确保有可用的 MCP 服务器
# 可以使用 examples/1-mcp-servers/stdio-server 中的示例
```

## 安装

```bash
pip install -r requirements.txt
```

## 运行

```bash
python src/simple_agent.py
```

## 使用示例

### 自动测试模式

运行脚本后会自动执行一系列测试用例：

```
User: 北京的天气怎么样？
🔧 Calling tool: get_weather
   Arguments: {"city": "Beijing"}
✓ Tool result: {...}
🤖 Agent: 根据查询结果：...

User: 帮我计算 123 加 456
🔧 Calling tool: add
   Arguments: {"a": 123, "b": 456}
✓ Tool result: 579
🤖 Agent: 计算结果是：579
```

### 交互模式

测试完成后进入交互模式：

```
Interactive Mode (type 'quit' to exit)
============================================================

You: 上海的天气怎么样？
🤖 Agent: 根据查询结果：...

You: 10 乘以 20
🤖 Agent: 计���结果是：200

You: quit
✓ Agent closed
```

## 代码结构

### SimpleAgent 类

```python
class SimpleAgent:
    def __init__(self, mcp_proxy_url, server_id=None):
        """初始化 Agent"""

    async def initialize(self):
        """加载 MCP 工具"""

    async def call_tool(self, tool_name, arguments):
        """调用 MCP 工具"""

    def parse_user_intent(self, user_input):
        """解析用户意图（简化版）"""

    def generate_response(self, user_input, tool_result):
        """生成响应（简化版）"""

    async def run(self, user_input):
        """处理用户输入的主循环"""
```

### 支持的命令

当前实现支持以下类型的请求：

1. **天气查询**
   - "北京的天气怎么样？"
   - "查询上海天气"

2. **加法计算**
   - "123 加 456"
   - "10 + 20"

3. **乘法计算**
   - "15 乘以 8"
   - "5 * 6"

4. **文本转大写**
   - "把 'hello' 转换成大写"

5. **单词计数**
   - "统计 'hello world' 有多少个单词"

## 扩展为真实 Agent

### 1. 集成真实 LLM

```python
import openai

class RealAgent(SimpleAgent):
    def __init__(self, *args, openai_api_key, **kwargs):
        super().__init__(*args, **kwargs)
        self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)

    async def parse_user_intent(self, user_input):
        """使用 LLM 解析意图"""
        # 将工具转换为 OpenAI function calling 格式
        functions = [self._tool_to_function(t) for t in self.tools]

        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_input}
            ],
            functions=functions,
            function_call="auto"
        )

        if response.choices[0].function_call:
            return {
                "tool_name": response.choices[0].function_call.name,
                "arguments": json.loads(response.choices[0].function_call.arguments)
            }

        return None

    def _tool_to_function(self, tool):
        """将 MCP 工具转换为 OpenAI function 格式"""
        return {
            "name": tool["name"],
            "description": tool.get("description", ""),
            "parameters": tool.get("inputSchema", {})
        }
```

### 2. 支持多轮对话

```python
class MultiTurnAgent(SimpleAgent):
    async def run(self, user_input, max_iterations=5):
        """支持多轮工具调用"""
        self.conversation_history.append({"role": "user", "content": user_input})

        for i in range(max_iterations):
            # 获取 LLM 响应
            response = await self.get_llm_response()

            # 如果不需要调用工具，返回
            if not response.tool_calls:
                return response.content

            # 执行工具调用
            for tool_call in response.tool_calls:
                result = await self.call_tool(
                    tool_call.name,
                    tool_call.arguments
                )
                # 添加到历史
                self.conversation_history.append({
                    "role": "tool",
                    "content": result
                })

        return "达到最大迭代次数"
```

### 3. 添加记忆功能

```python
class MemoryAgent(SimpleAgent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.long_term_memory = []

    async def run(self, user_input):
        # 从长期记忆中检索相关信息
        relevant_memory = self.retrieve_memory(user_input)

        # 将记忆添加到上下文
        context = f"相关记忆：{relevant_memory}\n\n用户输入：{user_input}"

        # 处理请求
        response = await super().run(context)

        # 保存到长期记忆
        self.save_memory(user_input, response)

        return response
```

### 4. 并行工具调用

```python
async def run_parallel(self, user_input):
    """并行执行多个工具调用"""
    intents = self.parse_multiple_intents(user_input)

    # 并行调用所有工具
    tasks = [
        self.call_tool(intent["tool_name"], intent["arguments"])
        for intent in intents
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # 汇总结果
    return self.generate_response(user_input, results)
```

## 与真实 LLM 集成

### OpenAI

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key="your-api-key")

response = await client.chat.completions.create(
    model="gpt-4",
    messages=[...],
    tools=[...],  # MCP 工具
    tool_choice="auto"
)
```

### Anthropic Claude

```python
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key="your-api-key")

response = await client.messages.create(
    model="claude-3-5-sonnet-20241022",
    messages=[...],
    tools=[...],  # MCP 工具
    max_tokens=1024
)
```

### DeepSeek

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key="your-deepseek-api-key",
    base_url="https://api.deepseek.com"
)

response = await client.chat.completions.create(
    model="deepseek-chat",
    messages=[...],
    tools=[...],  # MCP 工具
)
```

## 调试

启用详细日志：

```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

## 限制

这是一个简化的教学示例，有以下限制：

1. 使用关键词匹配而非真实 LLM
2. 不支持复杂的多轮对话
3. 不支持并行工具调用
4. 没有记忆和上下文管理

查看 [DeepSeek Agent](../deepseek-agent/) 和 [LangChain Agent](../langchain-agent/) 了解更完整的实现。

## 相关资源

- [DeepSeek Agent 示例](../deepseek-agent/)
- [LangChain Agent 示例](../langchain-agent/)
- [MCP Proxy Client](../../2-mcp-clients/proxy-client/)
- [返回上级目录](../)
