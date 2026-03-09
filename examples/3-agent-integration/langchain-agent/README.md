# LangChain MCP Agent

使用 LangChain 框架集成 MCP 工具的示例，展示如何在 LangChain 生态中使用 MCP。

## 功能特性

- ✅ LangChain Agent 集成
- ✅ 自动工具转换（MCP → LangChain Tool）
- ✅ 支持多种 LLM（OpenAI、Anthropic、DeepSeek 等）
- ✅ 内置记忆和对话管理
- ✅ 丰富的 Chain 组合能力

## 架构说明

LangChain 提供了强大的 Agent 框架，可以轻松集成 MCP 工具：

```
LangChain Agent
    ↓
MCP Tool Wrapper
    ↓
MCP Proxy Client
    ↓
MCP Server
```

## 前置条件

1. LangChain 和相关依赖
2. LLM API Key（OpenAI、Anthropic 或 DeepSeek）
3. MCP Market 后端运行在 `http://localhost:3000`

## 安装

```bash
pip install langchain langchain-openai langchain-anthropic httpx
```

## 快速开始

### 基础示例

```python
from langchain_mcp_agent import create_mcp_agent
from langchain_openai import ChatOpenAI

# 创建 LLM
llm = ChatOpenAI(model="gpt-4", api_key="your-api-key")

# 创建 MCP Agent
agent = create_mcp_agent(
    llm=llm,
    mcp_proxy_url="http://localhost:3000",
    server_id="your-server-id"
)

# 运行
response = agent.invoke({"input": "北京的天气怎么样？"})
print(response["output"])
```

### 使用不同的 LLM

#### OpenAI

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4",
    api_key="your-openai-api-key"
)
```

#### Anthropic Claude

```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-3-5-sonnet-20241022",
    api_key="your-anthropic-api-key"
)
```

#### DeepSeek

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="deepseek-chat",
    api_key="your-deepseek-api-key",
    base_url="https://api.deepseek.com"
)
```

## 实现示例

### MCP Tool Wrapper

将 MCP 工具包装为 LangChain Tool：

```python
from langchain.tools import BaseTool
from typing import Optional, Type
from pydantic import BaseModel, Field
import httpx

class MCPTool(BaseTool):
    """MCP 工具的 LangChain 包装器"""

    name: str
    description: str
    mcp_proxy_url: str
    server_id: str
    tool_name: str
    args_schema: Optional[Type[BaseModel]] = None

    def _run(self, **kwargs) -> str:
        """同步执行（LangChain 要求）"""
        import asyncio
        return asyncio.run(self._arun(**kwargs))

    async def _arun(self, **kwargs) -> str:
        """异步执行 MCP 工具"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.mcp_proxy_url}/api/mcp/call-tool",
                json={
                    "serverId": self.server_id,
                    "toolName": self.tool_name,
                    "arguments": kwargs
                }
            )
            response.raise_for_status()
            result = response.json()
            return str(result)
```

### 创建 Agent

```python
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate

def create_mcp_agent(llm, mcp_proxy_url, server_id):
    """创建 MCP Agent"""

    # 1. 加载 MCP 工具
    tools = load_mcp_tools(mcp_proxy_url, server_id)

    # 2. 创建提示模板
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant with access to various tools."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # 3. 创建 Agent
    agent = create_tool_calling_agent(llm, tools, prompt)

    # 4. 创建 Executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        max_iterations=5
    )

    return agent_executor

def load_mcp_tools(mcp_proxy_url, server_id):
    """加载 MCP 工具并转换为 LangChain Tools"""
    import httpx

    # 获取工具列表
    response = httpx.get(
        f"{mcp_proxy_url}/api/mcp/servers/{server_id}/tools"
    )
    response.raise_for_status()
    mcp_tools = response.json()

    # 转换为 LangChain Tools
    tools = []
    for mcp_tool in mcp_tools:
        tool = MCPTool(
            name=mcp_tool["name"],
            description=mcp_tool.get("description", ""),
            mcp_proxy_url=mcp_proxy_url,
            server_id=server_id,
            tool_name=mcp_tool["name"],
            args_schema=create_args_schema(mcp_tool.get("inputSchema", {}))
        )
        tools.append(tool)

    return tools
```

### 参数 Schema 转换

```python
from pydantic import BaseModel, create_model
from typing import Any, Dict

def create_args_schema(input_schema: Dict[str, Any]) -> Type[BaseModel]:
    """将 JSON Schema 转换为 Pydantic Model"""
    if not input_schema or "properties" not in input_schema:
        return None

    fields = {}
    properties = input_schema.get("properties", {})
    required = input_schema.get("required", [])

    for field_name, field_info in properties.items():
        field_type = get_python_type(field_info.get("type", "string"))
        field_description = field_info.get("description", "")

        if field_name in required:
            fields[field_name] = (field_type, Field(..., description=field_description))
        else:
            fields[field_name] = (field_type, Field(None, description=field_description))

    return create_model("DynamicSchema", **fields)

def get_python_type(json_type: str):
    """JSON Schema 类型转 Python 类型"""
    type_mapping = {
        "string": str,
        "number": float,
        "integer": int,
        "boolean": bool,
        "array": list,
        "object": dict
    }
    return type_mapping.get(json_type, str)
```

## 高级用法

### 添加记忆

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=memory,
    verbose=True
)

# 多轮对话
response1 = agent_executor.invoke({"input": "北京的天气怎么样？"})
response2 = agent_executor.invoke({"input": "那上海呢？"})  # 带上下文
```

### 自定义提示

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个专业的数据分析助手。
    你可以使用提供的工具来查询数据、进行计算和生成报告。
    请始终保持专业和准确。
    """),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
```

### 流式输出

```python
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

llm = ChatOpenAI(
    model="gpt-4",
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)

agent_executor = create_mcp_agent(llm, mcp_proxy_url, server_id)
response = agent_executor.invoke({"input": "讲个笑话"})
```

### Chain 组合

```python
from langchain.chains import LLMChain, SequentialChain

# 创建多个 Chain
weather_chain = LLMChain(llm=llm, prompt=weather_prompt)
analysis_chain = LLMChain(llm=llm, prompt=analysis_prompt)

# 组合
overall_chain = SequentialChain(
    chains=[weather_chain, analysis_chain],
    input_variables=["city"],
    output_variables=["analysis"]
)

result = overall_chain({"city": "Beijing"})
```

## 完整示例

```python
import asyncio
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain.memory import ConversationBufferMemory

async def main():
    # 1. 创建 LLM
    llm = ChatOpenAI(
        model="gpt-4",
        api_key="your-api-key",
        temperature=0
    )

    # 2. 加载 MCP 工具
    tools = load_mcp_tools(
        mcp_proxy_url="http://localhost:3000",
        server_id="your-server-id"
    )

    # 3. 创建提示
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # 4. 创建 Agent
    agent = create_tool_calling_agent(llm, tools, prompt)

    # 5. 添加记忆
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )

    # 6. 创建 Executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,
        max_iterations=5
    )

    # 7. 运��
    queries = [
        "北京的天气怎么样？",
        "帮我计算 123 + 456",
        "把 'hello world' 转换成大写"
    ]

    for query in queries:
        print(f"\nUser: {query}")
        response = agent_executor.invoke({"input": query})
        print(f"Agent: {response['output']}")

if __name__ == "__main__":
    asyncio.run(main())
```

## 与其他 LangChain 组件集成

### RAG (Retrieval-Augmented Generation)

```python
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA

# 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.from_documents(documents, embeddings)

# 创建 RAG Chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever()
)

# 结合 MCP Agent
# ...
```

### LangGraph

```python
from langgraph.prebuilt import create_react_agent

# 使用 LangGraph 创建更复杂的 Agent
agent = create_react_agent(
    llm=llm,
    tools=mcp_tools
)

result = agent.invoke({"messages": [("user", "查询天气")]})
```

## 调试

```python
# 启用详细日志
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,  # 显示���间步骤
    return_intermediate_steps=True  # 返回中间步骤
)

response = agent_executor.invoke({"input": "..."})
print(response["intermediate_steps"])
```

## 性能优化

1. **工具缓存** - 缓存工具列表
2. **批量处理** - 使用 `batch()` 方法
3. **异步执行** - 使用 `ainvoke()` 方法
4. **连接池** - 复用 HTTP 连接

## 相关资源

- [LangChain 文档](https://python.langchain.com/)
- [LangChain Agents](https://python.langchain.com/docs/modules/agents/)
- [Simple Agent 示例](../simple-agent/)
- [DeepSeek Agent 示例](../deepseek-agent/)
- [返回上级目录](../)

## 注意事项

> **注意**: 这是一个概念示例。完整的实现需要根据您的具体需求进行调整。

> **提示**: LangChain 生态系统非常丰富，您可以结合 LangSmith、LangServe 等工具构建完整的 AI 应用。
