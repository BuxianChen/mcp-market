import asyncio
from typing import Optional

from mcp import ClientSession, StdioServerParameters
from mcp.client.sse import sse_client
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamable_http_client

from src.types.mcp import (
    Capabilities,
    ConnectionConfig,
    HttpConfig,
    McpTestResult,
    Prompt,
    Resource,
    ServerInfo,
    SseConfig,
    StdioConfig,
    Tool,
)


class McpTestService:
    """Service for testing MCP connections"""

    async def test_connection(self, config: ConnectionConfig, timeout: int = 10000) -> McpTestResult:
        """Test MCP server connection"""
        try:
            # Connect with timeout
            async with asyncio.timeout(timeout / 1000):
                # Create transport based on connection type
                if isinstance(config, SseConfig):
                    async with sse_client(config.url) as (read_stream, write_stream):
                        return await self._test_with_streams(read_stream, write_stream)
                elif isinstance(config, HttpConfig):
                    async with streamable_http_client(config.url) as (read_stream, write_stream):
                        return await self._test_with_streams(read_stream, write_stream)
                elif isinstance(config, StdioConfig):
                    server_params = StdioServerParameters(
                        command=config.command,
                        args=config.args or [],
                        env=config.env,
                    )
                    async with stdio_client(server_params) as (read_stream, write_stream):
                        return await self._test_with_streams(read_stream, write_stream)
                else:
                    raise ValueError(f"Unsupported connection type: {type(config)}")

        except asyncio.TimeoutError:
            return McpTestResult(
                success=False,
                message="Connection failed",
                error="Connection timeout",
            )
        except Exception as e:
            return McpTestResult(
                success=False,
                message="Connection failed",
                error=str(e),
            )

    async def _test_with_streams(self, read_stream, write_stream) -> McpTestResult:
        """Test connection with given streams"""
        async with ClientSession(read_stream, write_stream) as session:
            # Initialize connection
            init_result = await session.initialize()

            # Get server info
            server_info = ServerInfo(
                name=init_result.serverInfo.name,
                version=init_result.serverInfo.version,
                protocol_version=init_result.protocolVersion,
            )

            # Get capabilities
            capabilities = Capabilities()

            # List tools
            try:
                tools_result = await session.list_tools()
                capabilities.tools = [
                    Tool(
                        name=t.name,
                        description=t.description,
                        input_schema=t.inputSchema,
                    )
                    for t in tools_result.tools
                ]
            except Exception:
                pass

            # List resources
            try:
                resources_result = await session.list_resources()
                capabilities.resources = [
                    Resource(
                        uri=r.uri,
                        name=r.name,
                        description=r.description,
                    )
                    for r in resources_result.resources
                ]
            except Exception:
                pass

            # List prompts
            try:
                prompts_result = await session.list_prompts()
                capabilities.prompts = [
                    Prompt(
                        name=p.name,
                        description=p.description,
                        arguments=p.arguments,
                    )
                    for p in prompts_result.prompts
                ]
            except Exception:
                pass

            return McpTestResult(
                success=True,
                message="Connection successful",
                server_info=server_info,
                capabilities=capabilities,
            )


# Singleton instance
mcp_test_service = McpTestService()
