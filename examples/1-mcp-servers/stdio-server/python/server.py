"""
Simple STDIO MCP Server Example

这是一个基础的 MCP 服务器示例，使用 STDIO 传输协议。
包含计算器、天气查询和文本处理工具。
"""
import asyncio
import json
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent


# 创建 MCP Server 实例
server = Server("stdio-example-server")


# ============ 工具实现 ============

def add(a: float, b: float) -> float:
    """加法"""
    return a + b


def subtract(a: float, b: float) -> float:
    """减法"""
    return a - b


def multiply(a: float, b: float) -> float:
    """乘法"""
    return a * b


def divide(a: float, b: float) -> float:
    """除法"""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b


def get_weather(city: str) -> dict:
    """获取天气信息（模拟数据）"""
    # 模拟天气数据
    weather_data = {
        "beijing": {"temperature": 15, "condition": "晴天", "humidity": 45},
        "shanghai": {"temperature": 20, "condition": "多云", "humidity": 60},
        "guangzhou": {"temperature": 25, "condition": "小雨", "humidity": 75},
    }

    city_lower = city.lower()
    if city_lower in weather_data:
        return {
            "city": city,
            **weather_data[city_lower]
        }
    else:
        return {
            "city": city,
            "temperature": 18,
            "condition": "未知",
            "humidity": 50
        }


def to_upper_case(text: str) -> str:
    """转换为大写"""
    return text.upper()


def to_lower_case(text: str) -> str:
    """转换为小写"""
    return text.lower()


def reverse_text(text: str) -> str:
    """反转文本"""
    return text[::-1]


def word_count(text: str) -> int:
    """统计单词数"""
    return len(text.split())


# ============ MCP 协议处理 ============

@server.list_tools()
async def list_tools() -> list[Tool]:
    """列出所有可用工具"""
    return [
        # 计算器工具
        Tool(
            name="add",
            description="两数相加",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "第一个数"},
                    "b": {"type": "number", "description": "第二个数"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="subtract",
            description="两数相减",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "被减数"},
                    "b": {"type": "number", "description": "减数"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="multiply",
            description="两数相乘",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "第一个��"},
                    "b": {"type": "number", "description": "第二个数"},
                },
                "required": ["a", "b"],
            },
        ),
        Tool(
            name="divide",
            description="两数相除",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "被除数"},
                    "b": {"type": "number", "description": "除数"},
                },
                "required": ["a", "b"],
            },
        ),
        # 天气工具
        Tool(
            name="get_weather",
            description="获取城市天气信息（模拟数据）",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名称"},
                },
                "required": ["city"],
            },
        ),
        # 文本处理工具
        Tool(
            name="to_upper_case",
            description="将文本转换为大写",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "输入文本"},
                },
                "required": ["text"],
            },
        ),
        Tool(
            name="to_lower_case",
            description="将文本转换为小写",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "输入文本"},
                },
                "required": ["text"],
            },
        ),
        Tool(
            name="reverse_text",
            description="反转文本",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "输入文本"},
                },
                "required": ["text"],
            },
        ),
        Tool(
            name="word_count",
            description="统计文本中的单词数",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "输入文本"},
                },
                "required": ["text"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """执行工具调用"""
    try:
        # 计算器工具
        if name == "add":
            result = add(arguments["a"], arguments["b"])
        elif name == "subtract":
            result = subtract(arguments["a"], arguments["b"])
        elif name == "multiply":
            result = multiply(arguments["a"], arguments["b"])
        elif name == "divide":
            result = divide(arguments["a"], arguments["b"])
        # 天气工具
        elif name == "get_weather":
            result = get_weather(arguments["city"])
        # 文本工具
        elif name == "to_upper_case":
            result = to_upper_case(arguments["text"])
        elif name == "to_lower_case":
            result = to_lower_case(arguments["text"])
        elif name == "reverse_text":
            result = reverse_text(arguments["text"])
        elif name == "word_count":
            result = word_count(arguments["text"])
        else:
            raise ValueError(f"Unknown tool: {name}")

        # 返回结果
        return [TextContent(
            type="text",
            text=json.dumps(result, ensure_ascii=False)
        )]
    except Exception as e:
        # 错误处理
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]


# ============ 启动服务器 ============

async def main():
    """主函数"""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
