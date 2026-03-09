"""
Proxy MCP Client - Python 实现

通过 MCP Market 代理层连接和使用 MCP 服务器。
适用于生产环境，提供统一的服务器管理和监控。
"""
import asyncio
import json
from typing import Any, Optional

import httpx


class ProxyMCPClient:
    """通过代理层连接的 MCP 客户端"""

    def __init__(self, proxy_url: str = "http://localhost:3000"):
        """
        初始化代理客户端

        Args:
            proxy_url: MCP Market 代理服务器地址
        """
        self.proxy_url = proxy_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=30.0)

    async def list_servers(self) -> list[dict]:
        """
        获取所有可用的 MCP 服务器

        Returns:
            服务器列表
        """
        print("Fetching server list...")
        response = await self.client.get(f"{self.proxy_url}/api/mcp/servers")
        response.raise_for_status()

        servers = response.json()
        print(f"✓ Found {len(servers)} servers")
        return servers

    async def get_server_info(self, server_id: str) -> dict:
        """
        获取服务器详细信息

        Args:
            server_id: 服务器 ID

        Returns:
            服务器信息
        """
        response = await self.client.get(
            f"{self.proxy_url}/api/mcp/servers/{server_id}"
        )
        response.raise_for_status()
        return response.json()

    async def list_tools(self, server_id: str) -> list[dict]:
        """
        获取指定服务器的工具列表

        Args:
            server_id: 服务器 ID

        Returns:
            工具列表
        """
        print(f"\nFetching tools for server: {server_id}")
        response = await self.client.get(
            f"{self.proxy_url}/api/mcp/servers/{server_id}/tools"
        )
        response.raise_for_status()

        tools = response.json()
        print(f"✓ Found {len(tools)} tools")
        return tools

    async def call_tool(
        self,
        server_id: str,
        tool_name: str,
        arguments: dict[str, Any]
    ) -> Any:
        """
        调用工具

        Args:
            server_id: 服务器 ID
            tool_name: 工具名称
            arguments: 工具参数

        Returns:
            工具执行结果
        """
        print(f"\nCalling tool: {tool_name} on server: {server_id}")
        print(f"Arguments: {json.dumps(arguments, indent=2)}")

        response = await self.client.post(
            f"{self.proxy_url}/api/mcp/call-tool",
            json={
                "serverId": server_id,
                "toolName": tool_name,
                "arguments": arguments
            }
        )
        response.raise_for_status()

        result = response.json()
        print("✓ Tool executed successfully")
        return result

    async def test_connection(self, server_id: str) -> dict:
        """
        测试服务器连接

        Args:
            server_id: 服务器 ID

        Returns:
            测试结果
        """
        print(f"\nTesting connection to server: {server_id}")
        response = await self.client.post(
            f"{self.proxy_url}/api/mcp/servers/{server_id}/test"
        )
        response.raise_for_status()

        result = response.json()
        if result.get("success"):
            print("✓ Connection test passed")
        else:
            print(f"✗ Connection test failed: {result.get('error')}")
        return result

    async def close(self):
        """关闭客户端"""
        await self.client.aclose()
        print("\n✓ Client closed")


async def main():
    """主函数 - 演示代理客户端使用"""

    # 创建代理客户端
    client = ProxyMCPClient("http://localhost:3000")

    try:
        # 1. 获取服务器列表
        print("=" * 50)
        print("Available MCP Servers:")
        print("=" * 50)

        servers = await client.list_servers()
        for server in servers:
            print(f"\n• {server['name']} (ID: {server['id']})")
            print(f"  Type: {server['type']}")
            print(f"  Status: {server.get('status', 'unknown')}")

        if not servers:
            print("\n⚠ No servers available. Please add a server first.")
            return

        # 使用第一个服务器进行演示
        server_id = servers[0]["id"]
        print(f"\n{'=' * 50}")
        print(f"Using server: {servers[0]['name']}")
        print("=" * 50)

        # 2. 测试连接
        await client.test_connection(server_id)

        # 3. 获取工具列表
        tools = await client.list_tools(server_id)
        print("\n" + "=" * 50)
        print("Available Tools:")
        print("=" * 50)
        for tool in tools:
            print(f"\n• {tool['name']}")
            print(f"  {tool.get('description', 'No description')}")

        # 4. 调用工具示例
        print("\n" + "=" * 50)
        print("Tool Call Examples:")
        print("=" * 50)

        # 根据可用工具调用示例
        if any(t["name"] == "add" for t in tools):
            result = await client.call_tool(
                server_id,
                "add",
                {"a": 10, "b": 20}
            )
            print(f"Result: {json.dumps(result, indent=2)}")

        if any(t["name"] == "get_weather" for t in tools):
            result = await client.call_tool(
                server_id,
                "get_weather",
                {"city": "Beijing"}
            )
            print(f"Result: {json.dumps(result, indent=2)}")

    except httpx.HTTPStatusError as e:
        print(f"\n✗ HTTP Error: {e.response.status_code}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # 5. 关闭客户端
        await client.close()


if __name__ == "__main__":
    print("=" * 50)
    print("Proxy MCP Client Example")
    print("=" * 50)
    print("\n⚠ Make sure MCP Market backend is running on http://localhost:3000\n")
    asyncio.run(main())
