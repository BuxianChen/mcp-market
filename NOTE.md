(ClaudeCode) 注意: 本文件内容可能与项目无关或相关, 不要参考或修改此文件内容


用法:

(1) 本地: 类似 Cline 的方式, 修改配置文件, 有了 MCP 市场后, 全部配置成 streamableHttp
(2) 云端(例如AI平台),


(1) 服务提供方是 OpenAPI 的, 自动转换为 MCP
(2) 服务提供方本身是 MCP 的, 做个转发


## MCP 连接以及功能测试

npx @modelcontextprotocol/inspector


## MCP 市场调研

MCP 市场:

- XPack: https://github.com/xpack-ai/XPack-MCP-Marketplace
- Higress: https://mcp.higress.ai/
  - cherry studio https://www.cherry-ai.com/
- MCPMarket: https://mcpmarket.com/
- MCP Servers: https://mcpservers.org/
- Cline MCP marketplace: 
- 阿里云百炼: https://bailian.console.aliyun.com/
- GitHub Copilot:
- KongAI: https://konghq.com/blog/product-releases/enterprise-mcp-gateway
- MCP Hive: https://mcp-hive.com/?utm_source=chatgpt.com
- microsoft, mcp-gateway: https://github.com/microsoft/mcp-gateway



马克的技术工作坊推荐:
- mcp.so
- https://mcpmarket.com/
- smithery.ai



[sparfenyuk/mcp-proxy](https://github.com/sparfenyuk/mcp-proxy): 没啥用, 是 stdio 和 sse 互相转换


openclaw: 
nanoclaw: openclaw 的简化版
nanobot: 最简 python 实现逻辑
langchain: AgentBuilder, DeepAgents




## MCP Python SDK 记录

```python
app = mcp.streamable_http_app()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including OPTIONS
    allow_headers=["*"],
)

# Usage: uvicorn src.new_server:app --port 3001
```


## Higress

已操作的部分:

参照 [官方文档](https://higress.cn/en/docs/ai/mcp-quick-start_docker/) 的操作步骤

(1, OK) 先启动 Higress 服务, 并修改配置文件重启
(2, OK) 启动 Redis 服务
(3, Error) 启动 Nacos 服务, 使用如下命令, 但出现端口冲突
```bash
docker run --name nacos -e MODE=standalone -e NACOS_AUTH_TOKEN=U2VjcmV0S2V5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5 -e NACOS_AUTH_IDENTITY_KEY=nacos_server_key -e NACOS_AUTH_IDENTITY_VALUE=nacos_server_value -p 8080:8080 -p 8848:8848 -p 9848:9848 -d nacos/nacos-server:v3.1.1
```

(4, OK) 浏览器打开 `http://localhost:8001`, 设置账号密码
Higress账号密码
admin/higress

(5) 暂时关闭所有的 docker 服务



## Cline

https://github.com/zcaceres/fetch-mcp

Cline 的逻辑:

```
VSCode Extension Layer
│
├─ ~/.vscode-server/data/User/globalStorage/
│        └─ saoudrizwan.claude-dev
│            └─ cline_mcp_settings.json
│
│      (Cline 插件配置)
│
Agent Runtime Layer
│
├─ ~/.cline
│     ├─ logs
│     ├─ cache
│     └─ conversations
│
│      (Cline 运行数据)
│
User Workspace Layer
│
└─ /home/buxian/Cline
      └─ MCP/
          └─ fetch-mcp
```

其中 cline_mcp_settings.json 文件内容大致如下:

```json
{
  "mcpServers": {
    "test": {
      "url": "http://127.0.0.1:8000/mcp",
      "type": "streamableHttp",
      "disabled": false,
      "autoApprove": []
    },
    "github.com/zcaceres/fetch-mcp": {
      "command": "node",
      "args": ["/home/buxian/Cline/MCP/fetch-mcp/dist/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

User Workspace Layer 目录类似这样, 用户配置的 :

```
/home/buxian/Cline/
├── Hooks
├── MCP
│   └── fetch-mcp
├── Rules
└── Workflows
```

VSCode Extension Layer 是插件的配置信息, saoudrizwan.claude-dev 是 VSCode extention 的 ID (`<publisher>.<extension>`)


Agent Runtime Layer 是 cline 插件的 应用运行数据目录

插件的 package.json 文件:

```
~/.vscode-server/extensions/saoudrizwan.claude-dev-3.70.0/package.json
```

## Prompt

帮我重新审视下这个项目，先暂时忽略examples目录和NOTE.md。
我希望继续 vibecoding 的方式进行开发, 已知的一些信息是:

**项目目标**
希望做一个企业级 MCP 中台，目标是对接其他 MCP server, 企业内部的 MCP server 可能是由各个业务系统提供的, 可能会是普通的 HTTP 服务, 或者已经按照 MCP server 的方式部署, 这个 MCP 中台会做一层地址转换, 使得下游的 MCP Client 或 MCP Host 能通过 MCP 中台进行对接, 这样做的好处是:

(1) 由于企业内部系统繁多, 各个系统间对接一般是需要开墙才能访问, 有了 MCP 中台后, 所有的 MCP server 都可以统一与 MCP 中台所在的系统进行开墙, 对接, 注册. 而不同系统的 MCP client / MCP Host / Agent 要使用其他系统的 MCP server 提供的服务, 只需要直接与 MCP 中台进行开墙对接
(2) MCP server 的权限管理有统一的平台进行管理
(3) MCP server 作为每个系统建设的基础功能, 有个统一的场所进行共享
(4) 后期方便与其他企业内的 AI 系统做对接, 例如可以建立一个 Agent 平台: 只需要输入提示词, 选择配置相应的 MCP server, 就能快速搭建一个特定场景下的智能体
(5) MCP 作为一个新的协议, 很多已有系统提供的服务可能都是 HTTP 接口, 不方便改造为 MCP Server, MCP 中台需要支持对这类服务自动转化为 MCP server.

我本人的信息
(1) 主要的技术栈是 Python, 熟悉 Docker, MySQL, SQLite, Redis 等, 对前后端不熟悉, 但技术栈选型仍以推荐为准, 但在不影响一般的最佳实践上可以倾向于我熟悉的技术

需要了解的内容:

(1) 项目的前后端实现框架, 以及目前我看 node_modules 分别位于项目根目录和 frontend 目录, 是否应该分别转移至 frontend 和 backend 目录更合理

(2) 目前的前端似乎不支持连接后进行测试, 例如调用 MCP server 中的某个 tool, 我希望增加此功能, 应该类似于官方的 `npx @modelcontextprotocol/inspector` 时的功能

(3) 目前平台应该还没支持地址转换功能, 也不支持 HTTP 服务自动转化为 MCP server 的功能, 请实现

(4) 请帮我规划 examples 目录, 我计划放入一些 MCP server 的例子, 服务本身可以是 Restful 服务或者是已经按 MCP server 协议部署的服务, 另外还需要一些 MCP Client/MCP Host 的例子, 例如直接通过 MCP Client SDK 连接, 或者使用一些支持 MCP 的 AI Agent, 帮我大致规划一下 examples 目录结构
