"""MCP Client for connecting to MCP servers via SSE transport."""
import asyncio
from typing import Any, Dict, List
from mcp import ClientSession
from mcp.client.sse import sse_client


class McpTool:
    """Represents an MCP tool."""
    def __init__(self, name: str, description: str, input_schema: Dict[str, Any]):
        self.name = name
        self.description = description
        self.input_schema = input_schema


class McpClient:
    """Client for connecting to MCP servers."""

    def __init__(self, server_url: str):
        self.server_url = server_url
        self.session: ClientSession | None = None
        self._streams_context = None
        self._read = None
        self._write = None

    async def connect(self) -> None:
        """Connect to the MCP server."""
        # Use sse_client as a context manager
        self._streams_context = sse_client(self.server_url)
        streams = await self._streams_context.__aenter__()
        self._read, self._write = streams

        self.session = ClientSession(self._read, self._write)
        await self.session.__aenter__()
        await self.session.initialize()
        print(f"Connected to MCP Server at {self.server_url}")

    async def list_tools(self) -> List[McpTool]:
        """List all available tools from the MCP server."""
        if not self.session:
            raise RuntimeError("Client not connected")

        response = await self.session.list_tools()
        return [
            McpTool(
                name=tool.name,
                description=tool.description or "",
                input_schema=tool.inputSchema
            )
            for tool in response.tools
        ]

    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> str:
        """Call a tool on the MCP server."""
        if not self.session:
            raise RuntimeError("Client not connected")

        response = await self.session.call_tool(name, arguments)

        # Extract text content from response
        if response.content:
            for content in response.content:
                if content.type == "text":
                    return content.text

        return str(response)

    async def close(self) -> None:
        """Close the connection to the MCP server."""
        if self.session:
            await self.session.__aexit__(None, None, None)
            self.session = None
        if self._streams_context:
            await self._streams_context.__aexit__(None, None, None)
            self._streams_context = None
