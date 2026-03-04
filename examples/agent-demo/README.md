# Agent 示例 (Python + LangGraph)

这是一个使用 LangGraph 构建的 Agent 示例，通过 MCP 协议调用工具。

## 环境要求

- Python 3.10+
- pip 或 uv

## 安装

```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

## 配置

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入配置：
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选，支持兼容接口
MCP_SERVER_URLS=http://localhost:3001/mcp  # 支持多个，用逗号分隔
```

## 运行

确保 MCP Server 已经启动（在 `examples/mcp-server` 目录）：

```bash
# 在另一个终端
cd examples/mcp-server
source .venv/bin/activate
python -m src.server
```

然后启动 Agent：

```bash
python -m src.main
```

## 使用示例

启动后，你可以输入自然语言指令，Agent 会自动调用 MCP Server 提供的工具：

```
> 帮我计算 123 + 456
> 查询北京的天气
> 把 "hello world" 转成大写
> 统计 "the quick brown fox" 有多少个单词
> exit
```

## 功能特性

- 支持连接多个 MCP Server
- 支持 OpenAI 兼容的 API 接口
- 使用 LangGraph 构建 Agent 工作流
- 命令行交互界面

## 工作原理

1. Agent 连接到 MCP Server (http://localhost:3001/mcp)
2. 获取可用的工具列表
3. 使用 LangGraph 构建决策流程
4. 根据用户输入，LLM 决定调用哪个工具
5. 通过 MCP 协议调用工具并返回结果
