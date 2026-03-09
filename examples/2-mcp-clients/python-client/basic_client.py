"""
Basic MCP Client - Python 实现

这是一个基础的 MCP 客户端示例，展示如何连接 MCP 服务器并调用工具。
"""
import asyncio
import json
from typing import Any, Optional

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class BasicMCPClient:
    """基础 MCP 客户端"""

    def __init__(self, server_command: str, server_args: list[str]):
        """
        初始化客户端

        Args:
            server_command: 服务器启动命令（如 "python"）
            server_args: 服务器启动参数（如 ["server.py"]）
        """
        self.server_command = server_command
        self.server_args = server_args
        self.session: Optional[ClientSession] = None

    async def connect(self):
        """连接到 MCP 服务器"""
        print(f"Connecting to MCP server: {self.server_command} {' '.join(self.server_args)}")

        # 创建 STDIO 客户端
        server_params = StdioServerParameters(
            command=self.server_command,
            args=self.server_args
        )

        # 使用 stdio_client 上下文管理器
        self.stdio_context = stdio_client(server_params)
        read, write = await self.stdio_context.__aenter__()

        # 创建会话
        self.session_context = ClientSession(read, write)
        self.session = await self.session_context.__aenter__()

        # 初始化会话
        await self.session.initialize()
        print("✓ Connected to MCP server")

    async def list_tools(self) -> list[dict]:
        """
        获取服务器提供的所有工具

        Returns:
            工具列表
        """
        if not self.session:
            raise RuntimeError("Not connected to server")

        print("\nFetching tool list...")
        result = await self.session.list_tools()

        tools = []
        for tool in result.tools:
            tools.append({
                "name": tool.name,
                "description": tool.description,
                "inputSchema": tool.inputSchema
            })

        print(f"✓ Found {len(tools)} tools")
        return tools

    async def call_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        """
        调用工具

        Args:
            name: 工具名称
            arguments: 工具参数

        Returns:
            工具执行结果
        """
        if not self.session:
            raise RuntimeError("Not connected to server")

        print(f"\nCalling tool: {name}")
        print(f"Arguments: {json.dumps(arguments, indent=2)}")

        result = await self.session.call_tool(name, arguments)

        print("✓ Tool executed successfully")
        return result

    async def disconnect(self):
        """断开连接"""
        if self.session:
            await self.session_context.__aexit__(None, None, None)
            await self.stdio_context.__aexit__(None, None, None)
            print("\n✓ Disconnected from MCP server")


async def main():
    """主函数 - 演示客户端使用"""

    # 创建客户端（连接到 STDIO 服务器）
    client = BasicMCPClient(
        server_command="python",
        server_args=["../../1-mcp-servers/stdio-server/python/server.py"]
    )

    try:
        # 1. 连接到服务器
        await client.connect()

        # 2. 获取工具列表
        tools = await client.list_tools()
        print("\n" + "=" * 50)
        print("Available Tools:")
        print("=" * 50)
        for tool in tools:
            print(f"\n• {tool['name']}")
            print(f"  {tool['description']}")

        # 3. 调用工具示例
        print("\n" + "=" * 50)
        print("Tool Call Examples:")
        print("=" * 50)

        # 示例 1: 计算器
        result = await client.call_tool("add", {"a": 10, "b": 20})
        print(f"Result: {result.content[0].text}")

        # 示例 2: 天气查询
        result = await client.call_tool("get_weather", {"city": "Beijing"})
        print(f"Result: {result.content[0].text}")

        # 示例 3: 文本处理
        result = await client.call_tool("to_upper_case", {"text": "hello world"})
        print(f"Result: {result.content[0].text}")

        # 示例 4: 单词计数
        result = await client.call_tool("word_count", {"text": "The quick brown fox"})
        print(f"Result: {result.content[0].text}")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

    finally:
        # 4. 断开连接
        await client.disconnect()


if __name__ == "__main__":
    print("=" * 50)
    print("Basic MCP Client Example")
    print("=" * 50)
    asyncio.run(main())
