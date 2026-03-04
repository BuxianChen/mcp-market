"""Test MCP client connection."""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.mcp_client import McpClient


async def test():
    print("Testing MCP Client connection...")

    client = McpClient("http://localhost:3001/mcp")

    try:
        print("Connecting...")
        await client.connect()

        print("\nListing tools...")
        tools = await client.list_tools()
        print(f"Found {len(tools)} tools:")
        for tool in tools:
            print(f"  - {tool.name}: {tool.description}")

        print("\nTesting tool call (add)...")
        result = await client.call_tool("add", {"a": 10, "b": 20})
        print(f"Result: {result}")

        print("\nClosing connection...")
        await client.close()

        print("\n✅ Test passed!")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        await client.close()


if __name__ == "__main__":
    asyncio.run(test())