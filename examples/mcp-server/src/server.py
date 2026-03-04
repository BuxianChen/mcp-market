"""MCP Server implementation with FastAPI and SSE transport"""
import asyncio
import json
from typing import Any
from contextlib import asynccontextmanager

from starlette.applications import Starlette
from starlette.routing import Route, Mount
from starlette.responses import Response
from starlette.middleware.cors import CORSMiddleware
from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent

from .tools import calculator, weather, text_utils


# Create MCP Server instance
mcp_server = Server("example-mcp-server")


# Register tools
@mcp_server.list_tools()
async def list_tools() -> list[Tool]:
    """List all available tools."""
    return [
        Tool(
            name="add",
            description="Add two numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "First number"},
                    "b": {"type": "number", "description": "Second number"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="subtract",
            description="Subtract two numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "First number"},
                    "b": {"type": "number", "description": "Second number"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="multiply",
            description="Multiply two numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "First number"},
                    "b": {"type": "number", "description": "Second number"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="divide",
            description="Divide two numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "Dividend"},
                    "b": {"type": "number", "description": "Divisor"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="get_weather",
            description="Get weather information for a city (simulated data)",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                },
                "required": ["city"],
            },
        ),
        Tool(
            name="to_upper_case",
            description="Convert text to uppercase",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Input text"},
                },
                "required": ["text"],
            },
        ),
        Tool(
            name="to_lower_case",
            description="Convert text to lowercase",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Input text"},
                },
                "required": ["text"],
            },
        ),
        Tool(
            name="reverse_text",
            description="Reverse the text",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Input text"},
                },
                "required": ["text"],
            },
        ),
        Tool(
            name="word_count",
            description="Count words in text",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Input text"},
                },
                "required": ["text"],
            },
        ),
    ]


@mcp_server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Execute a tool with given arguments."""
    try:
        # Calculator tools
        if name == "add":
            result = calculator.add(arguments["a"], arguments["b"])
        elif name == "subtract":
            result = calculator.subtract(arguments["a"], arguments["b"])
        elif name == "multiply":
            result = calculator.multiply(arguments["a"], arguments["b"])
        elif name == "divide":
            result = calculator.divide(arguments["a"], arguments["b"])
        # Weather tool
        elif name == "get_weather":
            result = weather.get_weather(arguments["city"])
        # Text tools
        elif name == "to_upper_case":
            result = text_utils.to_upper_case(arguments["text"])
        elif name == "to_lower_case":
            result = text_utils.to_lower_case(arguments["text"])
        elif name == "reverse_text":
            result = text_utils.reverse_text(arguments["text"])
        elif name == "word_count":
            result = text_utils.word_count(arguments["text"])
        else:
            raise ValueError(f"Unknown tool: {name}")

        return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False))]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]


# Create SSE transport
sse = SseServerTransport("/messages/")


# Health check endpoint
async def health_check(request):
    """Health check endpoint."""
    return Response(
        content=json.dumps({"status": "ok", "server": "example-mcp-server"}),
        media_type="application/json"
    )


# SSE endpoint handler
async def handle_sse(request):
    """MCP endpoint for communication."""
    async with sse.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        await mcp_server.run(
            streams[0], streams[1], mcp_server.create_initialization_options()
        )
    return Response()


# Create Starlette app
app = Starlette(
    routes=[
        Route("/health", endpoint=health_check, methods=["GET"]),
        Route("/mcp", endpoint=handle_sse, methods=["GET"]),
        Mount("/messages/", app=sse.handle_post_message),
    ]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn

    print("Starting MCP Server on http://localhost:3001")
    print("MCP endpoint: http://localhost:3001/mcp")
    print("Health check: http://localhost:3001/health")

    uvicorn.run(app, host="0.0.0.0", port=3001)
