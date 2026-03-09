# Agent 集成示例

本目录包含将 MCP 服务器集成到 AI Agent 中的示例，展示如何让 AI Agent 使用 MCP 工具。

## 📚 示例列表

### 基础集成
- [Simple Agent](./simple-agent/) - 简单的 Agent 示例，展示基本集成模式
- [DeepSeek Agent](./deepseek-agent/) - 使用 DeepSeek API 的 Agent 实现
- [LangChain Agent](./langchain-agent/) - 使用 LangChain 框架的集成示例

## 🎯 什么是 MCP Agent？

MCP Agent 是能够使用 MCP 工具的 AI 代理。它可以：

1. **理解用户意图** - 分析用户请求
2. **选择合适的工具** - 从可用的 MCP 工具中选择
3. **执行工具调用** - 调用 MCP 工具并获取结果
4. **生成响应** - 基于工具结果回答用户

## 🔄 工作流程

```
用户请求
    ↓
AI Agent 分析
    ↓
选择 MCP 工具
    ↓
调用工具执行
    ↓
处理工具结果
    ↓
生成最终响应
```

## 🚀 快速开始

### 1. 简单 Agent

最基础的实现，适合学习：

```python
from simple_agent import SimpleAgent

agent = SimpleAgent(mcp_server_id="your-server-id")
response = await agent.run("北京的天气怎么样？")
print(response)
```

### 2. DeepSeek Agent

使用 DeepSeek API 的生产级实现：

```python
from deepseek_agent import DeepSeekAgent

agent = DeepSeekAgent(
    api_key="your-deepseek-api-key",
    mcp_proxy_url="http://localhost:3000"
)
response = await agent.run("帮我计算 123 + 456")
print(response)
```

### 3. LangChain Agent

使用 LangChain 框架的集成：

```python
from langchain_agent import create_mcp_agent

agent = create_mcp_agent(
    mcp_server_id="your-server-id",
    llm_api_key="your-api-key"
)
response = agent.run("查询天气并总结")
print(response)
```

## 🛠️ Agent 架构

### 基础架构

```python
class MCPAgent:
    def __init__(self, mcp_client, llm_client):
        self.mcp_client = mcp_client
        self.llm_client = llm_client
        self.tools = []

    async def initialize(self):
        """加载 MCP 工具"""
        self.tools = await self.mcp_client.list_tools()

    async def run(self, user_input):
        """执行 Agent 循环"""
        # 1. 获取 LLM 响应
        response = await self.llm_client.chat(
            messages=[{"role": "user", "content": user_input}],
            tools=self.tools
        )

        # 2. 如果需要调用工具
        if response.tool_calls:
            for tool_call in response.tool_calls:
                # 执行工具
                result = await self.mcp_client.call_tool(
                    tool_call.name,
                    tool_call.arguments
                )
                # 将结果返回给 LLM
                # ...

        # 3. 返回最终响应
        return response.content
```

### 高级架构

```python
class AdvancedMCPAgent:
    def __init__(self, mcp_client, llm_client):
        self.mcp_client = mcp_client
        self.llm_client = llm_client
        self.memory = []  # 对话历史
        self.tools = []

    async def run(self, user_input, max_iterations=5):
        """支持多轮工具调用的 Agent"""
        self.memory.append({"role": "user", "content": user_input})

        for i in range(max_iterations):
            # 获取 LLM 响应
            response = await self.llm_client.chat(
                messages=self.memory,
                tools=self.tools
            )

            # 如果不需要调用工具，返回结果
            if not response.tool_calls:
                return response.content

            # 执行所有工具调用
            for tool_call in response.tool_calls:
                result = await self.mcp_client.call_tool(
                    tool_call.name,
                    tool_call.arguments
                )

                # 添加到记忆
                self.memory.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })

        return "达到最大迭代次数"
```

## 📖 集成模式

### 模式 1: 直接集成

直接连接 MCP 服务器：

```python
from mcp import ClientSession
from mcp.client.stdio import stdio_client

# 连接 MCP 服务器
async with stdio_client(...) as (read, write):
    async with ClientSession(read, write) as session:
        # 使用 session 调用工具
        result = await session.call_tool("tool_name", {...})
```

**优点**: 低延迟，完整控制
**缺点**: 需要管理连接，复杂度高

### 模式 2: 代理集成

通过 MCP Market 代理层：

```python
from proxy_client import ProxyMCPClient

# 通过代理连接
client = ProxyMCPClient("http://localhost:3000")
result = await client.call_tool(server_id, "tool_name", {...})
```

**优点**: 简单易用，统一管理
**缺点**: 增加一层网络延迟

### 模式 3: 框架集成

使用 LangChain 等框架：

```python
from langchain.agents import create_mcp_agent
from langchain.llms import OpenAI

agent = create_mcp_agent(
    llm=OpenAI(),
    mcp_tools=[...]
)
```

**优点**: 开箱即用，功能丰富
**缺点**: 依赖框架，灵活性较低

## 🔧 工具转换

将 MCP 工具转换为 LLM 可用的格式：

### OpenAI 格式

```python
def mcp_tool_to_openai(mcp_tool):
    """将 MCP 工具转换为 OpenAI function calling 格式"""
    return {
        "type": "function",
        "function": {
            "name": mcp_tool["name"],
            "description": mcp_tool["description"],
            "parameters": mcp_tool["inputSchema"]
        }
    }
```

### Anthropic 格式

```python
def mcp_tool_to_anthropic(mcp_tool):
    """将 MCP 工具转换为 Anthropic tool use 格式"""
    return {
        "name": mcp_tool["name"],
        "description": mcp_tool["description"],
        "input_schema": mcp_tool["inputSchema"]
    }
```

## 💡 最佳实践

### 1. 错误处理

```python
async def safe_tool_call(client, tool_name, arguments):
    """安全的工具调用，带错误处理"""
    try:
        return await client.call_tool(tool_name, arguments)
    except Exception as e:
        return {
            "error": str(e),
            "message": f"工具 {tool_name} 调用失败"
        }
```

### 2. 工具选择优化

```python
def filter_relevant_tools(tools, user_input):
    """根据用户输入过滤相关工具"""
    # 使用关键词匹配、语义搜索等
    relevant_tools = []
    for tool in tools:
        if is_relevant(tool, user_input):
            relevant_tools.append(tool)
    return relevant_tools
```

### 3. 结果缓存

```python
class CachedAgent:
    def __init__(self):
        self.cache = {}

    async def call_tool_cached(self, tool_name, arguments):
        cache_key = f"{tool_name}:{json.dumps(arguments)}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        result = await self.call_tool(tool_name, arguments)
        self.cache[cache_key] = result
        return result
```

### 4. 并行工具调用

```python
async def parallel_tool_calls(client, tool_calls):
    """并行执行多个工具调用"""
    tasks = [
        client.call_tool(call["name"], call["arguments"])
        for call in tool_calls
    ]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

## 🎨 使用场景

### 场景 1: 智能助手

```python
# 用户: "帮我查询北京的天气，然后发送到我的邮箱"
# Agent 会:
# 1. 调用 get_weather 工具
# 2. 调用 send_email 工具
# 3. 返回确认消息
```

### 场景 2: 数据分析

```python
# 用户: "分析最近一周的销售数据"
# Agent 会:
# 1. 调用 query_database 工具获取数据
# 2. 调用 analyze_data 工具分析
# 3. 调用 generate_chart 工具生成图表
# 4. 返回分析报告
```

### 场景 3: 自动化工作流

```python
# 用户: "每天早上 9 点发送天气预报"
# Agent 会:
# 1. 创建定时任务
# 2. 每天调用 get_weather 工具
# 3. 调用 send_notification 工具
```

## 📊 性能优化

### 1. 工具预加载

```python
class OptimizedAgent:
    async def initialize(self):
        # 预加载工具列表
        self.tools = await self.mcp_client.list_tools()
        # 构建工具索引
        self.tool_index = {t["name"]: t for t in self.tools}
```

### 2. 连接池

```python
class AgentPool:
    def __init__(self, pool_size=5):
        self.agents = [Agent() for _ in range(pool_size)]

    async def run(self, user_input):
        # 使用空闲的 agent
        agent = await self.get_available_agent()
        return await agent.run(user_input)
```

### 3. 流式响应

```python
async def stream_response(agent, user_input):
    """流式返回 Agent 响应"""
    async for chunk in agent.run_stream(user_input):
        yield chunk
```

## 🔗 相关资源

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)
- [LangChain MCP Integration](https://python.langchain.com/docs/integrations/mcp)
- [MCP Client 示例](../2-mcp-clients/)

## 💡 下一步

1. 查看具体的 Agent 实现示例
2. 运行示例代码
3. 根据需求选择合适的集成模式
4. 开发自己的 MCP Agent 应用
