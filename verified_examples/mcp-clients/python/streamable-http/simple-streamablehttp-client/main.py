"""Simple task client demonstrating MCP tasks polling over streamable HTTP."""

import asyncio

import click
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from mcp.types import CallToolResult, TextContent


async def run(url: str) -> None:
    async with streamable_http_client(url) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List tools
            tools = await session.list_tools()
            print(f"Available tools: {[t.name for t in tools.tools]}")

            # Call the tool as a task
            print("\nCalling tool as a task...")

            
            tool_name = tools.tools[0].name
            print(f"\nCalling tool: {tool_name}")
            result = await session.call_tool(
                tool_name,
                {
                    "interval": 0.1,
                    "count": 2,
                    "caller": "test"
                }
            )

            print("\nTool result:")
            print(result)


@click.command()
@click.option("--url", default="http://localhost:8000/mcp", help="Server URL")
def main(url: str) -> int:
    asyncio.run(run(url))
    return 0


if __name__ == "__main__":
    main()