"""
Simple HTTP MCP Server

一个简单的 HTTP MCP 服务器实现，支持 MCP 协议的 HTTP 传输。
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import uvicorn

app = FastAPI(title="Simple HTTP MCP Server")

# 服务器信息
SERVER_INFO = {
    "name": "simple-http-mcp-server",
    "version": "1.0.0",
    "protocolVersion": "2024-11-05"
}

# 可用工具列表
TOOLS = [
    {
        "name": "add",
        "description": "Add two numbers",
        "inputSchema": {
            "type": "object",
            "properties": {
                "a": {"type": "number", "description": "First number"},
                "b": {"type": "number", "description": "Second number"}
            },
            "required": ["a", "b"]
        }
    },
    {
        "name": "multiply",
        "description": "Multiply two numbers",
        "inputSchema": {
            "type": "object",
            "properties": {
                "a": {"type": "number", "description": "First number"},
                "b": {"type": "number", "description": "Second number"}
            },
            "required": ["a", "b"]
        }
    },
    {
        "name": "get_weather",
        "description": "Get weather information for a city",
        "inputSchema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"}
            },
            "required": ["city"]
        }
    },
    {
        "name": "to_upper_case",
        "description": "Convert text to uppercase",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to convert"}
            },
            "required": ["text"]
        }
    }
]


class ToolCallRequest(BaseModel):
    """工具调用请求"""
    name: str
    arguments: Dict[str, Any]


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Simple HTTP MCP Server",
        "version": SERVER_INFO["version"],
        "endpoints": {
            "info": "/mcp/info",
            "tools": "/mcp/tools",
            "call": "/mcp/call"
        }
    }


@app.get("/mcp/info")
async def get_server_info():
    """获取服务器信息"""
    return {
        "jsonrpc": "2.0",
        "result": {
            "serverInfo": SERVER_INFO,
            "capabilities": {
                "tools": {}
            }
        }
    }


@app.get("/mcp/tools")
async def list_tools():
    """列出所有可用工具"""
    return {
        "jsonrpc": "2.0",
        "result": {
            "tools": TOOLS
        }
    }


@app.post("/mcp/call")
async def call_tool(request: ToolCallRequest):
    """调用工具"""
    tool_name = request.name
    arguments = request.arguments

    print(f"Calling tool: {tool_name} with arguments: {arguments}")

    # 执行工具
    try:
        result = execute_tool(tool_name, arguments)
        return {
            "jsonrpc": "2.0",
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": str(result)
                    }
                ]
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "jsonrpc": "2.0",
                "error": {
                    "code": -32000,
                    "message": str(e)
                }
            }
        )


def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> Any:
    """执行工具逻辑"""
    if tool_name == "add":
        a = arguments.get("a", 0)
        b = arguments.get("b", 0)
        return a + b

    elif tool_name == "multiply":
        a = arguments.get("a", 0)
        b = arguments.get("b", 0)
        return a * b

    elif tool_name == "get_weather":
        city = arguments.get("city", "Unknown")
        # 模拟天气数据
        weather_data = {
            "Beijing": {"temperature": 15, "condition": "Sunny", "humidity": 45},
            "Shanghai": {"temperature": 20, "condition": "Cloudy", "humidity": 60},
            "Shenzhen": {"temperature": 25, "condition": "Rainy", "humidity": 80},
        }
        weather = weather_data.get(city, {"temperature": 18, "condition": "Unknown", "humidity": 50})
        return f"{city} weather: {weather['temperature']}°C, {weather['condition']}, Humidity: {weather['humidity']}%"

    elif tool_name == "to_upper_case":
        text = arguments.get("text", "")
        return text.upper()

    else:
        raise ValueError(f"Unknown tool: {tool_name}")


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    print("=" * 60)
    print("Simple HTTP MCP Server")
    print("=" * 60)
    print("\nServer starting on http://localhost:8000")
    print("\nEndpoints:")
    print("  - GET  /              - Server info")
    print("  - GET  /mcp/info      - MCP server info")
    print("  - GET  /mcp/tools     - List tools")
    print("  - POST /mcp/call      - Call tool")
    print("  - GET  /health        - Health check")
    print("\n" + "=" * 60)

    uvicorn.run(app, host="0.0.0.0", port=8000)
