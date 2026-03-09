"""
Simple MCP Agent

一个简单的 AI Agent 实现，展示如何集成 MCP 工具。
使用模拟的 LLM 来演示工具调用流程。
"""
import asyncio
import json
import re
from typing import Any, Optional

import httpx


class SimpleAgent:
    """简单的 MCP Agent 实现"""

    def __init__(self, mcp_proxy_url: str = "http://localhost:3000", server_id: Optional[str] = None):
        """
        初始化 Agent

        Args:
            mcp_proxy_url: MCP Market 代理服务器地址
            server_id: MCP 服务器 ID（如果为 None，会使用第一个可用服务器）
        """
        self.mcp_proxy_url = mcp_proxy_url.rstrip("/")
        self.server_id = server_id
        self.client = httpx.AsyncClient(timeout=30.0)
        self.tools = []
        self.conversation_history = []

    async def initialize(self):
        """初始化 Agent，加载工具"""
        print("Initializing agent...")

        # 如果没有指定 server_id，获取第一个可用服务器
        if not self.server_id:
            response = await self.client.get(f"{self.mcp_proxy_url}/api/mcp/servers")
            response.raise_for_status()
            servers = response.json()

            if not servers:
                raise RuntimeError("No MCP servers available")

            self.server_id = servers[0]["id"]
            print(f"Using server: {servers[0]['name']} (ID: {self.server_id})")

        # 加载工具列表
        response = await self.client.get(
            f"{self.mcp_proxy_url}/api/mcp/servers/{self.server_id}/tools"
        )
        response.raise_for_status()
        self.tools = response.json()

        print(f"✓ Loaded {len(self.tools)} tools")
        for tool in self.tools:
            print(f"  - {tool['name']}: {tool.get('description', 'No description')}")

    async def call_tool(self, tool_name: str, arguments: dict) -> Any:
        """
        调用 MCP 工具

        Args:
            tool_name: 工具名称
            arguments: 工具参数

        Returns:
            工具执行结果
        """
        print(f"\n🔧 Calling tool: {tool_name}")
        print(f"   Arguments: {json.dumps(arguments, indent=2)}")

        response = await self.client.post(
            f"{self.mcp_proxy_url}/api/mcp/call-tool",
            json={
                "serverId": self.server_id,
                "toolName": tool_name,
                "arguments": arguments
            }
        )
        response.raise_for_status()

        result = response.json()
        print(f"✓ Tool result: {json.dumps(result, indent=2)[:200]}...")
        return result

    def parse_user_intent(self, user_input: str) -> dict:
        """
        解析用户意图（简化版本，实际应使用 LLM）

        Args:
            user_input: 用户输入

        Returns:
            解析结果，包含 tool_name 和 arguments
        """
        user_input_lower = user_input.lower()

        # 简单的关键词匹配
        if "天气" in user_input or "weather" in user_input_lower:
            # 提取城市名
            city_match = re.search(r'(北京|上海|深圳|广州|beijing|shanghai)', user_input, re.IGNORECASE)
            city = city_match.group(1) if city_match else "Beijing"

            return {
                "tool_name": "get_weather",
                "arguments": {"city": city}
            }

        elif "加" in user_input or "add" in user_input_lower or "+" in user_input:
            # 提取数字
            numbers = re.findall(r'\d+', user_input)
            if len(numbers) >= 2:
                return {
                    "tool_name": "add",
                    "arguments": {"a": int(numbers[0]), "b": int(numbers[1])}
                }

        elif "乘" in user_input or "multiply" in user_input_lower or "*" in user_input or "×" in user_input:
            numbers = re.findall(r'\d+', user_input)
            if len(numbers) >= 2:
                return {
                    "tool_name": "multiply",
                    "arguments": {"a": int(numbers[0]), "b": int(numbers[1])}
                }

        elif "大写" in user_input or "upper" in user_input_lower:
            # 提取要转换的文本
            text_match = re.search(r'["\'](.+?)["\']', user_input)
            if text_match:
                return {
                    "tool_name": "to_upper_case",
                    "arguments": {"text": text_match.group(1)}
                }

        elif "单词" in user_input or "word" in user_input_lower:
            text_match = re.search(r'["\'](.+?)["\']', user_input)
            if text_match:
                return {
                    "tool_name": "word_count",
                    "arguments": {"text": text_match.group(1)}
                }

        return None

    def generate_response(self, user_input: str, tool_result: Any) -> str:
        """
        生成最终响应（简化版本，实际应使用 LLM）

        Args:
            user_input: 用户输入
            tool_result: 工具执行结果

        Returns:
            响应文本
        """
        # 简单的模板响应
        if "天气" in user_input or "weather" in user_input.lower():
            return f"根据查询结果：{tool_result}"

        elif "加" in user_input or "add" in user_input.lower():
            return f"计算结果是：{tool_result}"

        elif "乘" in user_input or "multiply" in user_input.lower():
            return f"计算结果是：{tool_result}"

        else:
            return f"处理完成，结果：{tool_result}"

    async def run(self, user_input: str) -> str:
        """
        运行 Agent，处理用户输入

        Args:
            user_input: 用户输入

        Returns:
            Agent 响应
        """
        print(f"\n{'='*60}")
        print(f"User: {user_input}")
        print(f"{'='*60}")

        # 保存到对话历史
        self.conversation_history.append({"role": "user", "content": user_input})

        # 1. 解析用户意图
        intent = self.parse_user_intent(user_input)

        if not intent:
            response = "抱歉，我不太理解您的请求。我可以帮您查询天气、进行计算等。"
            self.conversation_history.append({"role": "assistant", "content": response})
            return response

        # 2. 调用工具
        try:
            tool_result = await self.call_tool(intent["tool_name"], intent["arguments"])

            # 3. 生成响应
            response = self.generate_response(user_input, tool_result)
            self.conversation_history.append({"role": "assistant", "content": response})

            print(f"\n🤖 Agent: {response}")
            return response

        except Exception as e:
            error_msg = f"抱歉，执行过程中出现错误：{str(e)}"
            self.conversation_history.append({"role": "assistant", "content": error_msg})
            print(f"\n❌ Error: {error_msg}")
            return error_msg

    async def close(self):
        """关闭 Agent"""
        await self.client.aclose()


async def main():
    """主函数 - 演示 Agent 使用"""

    print("=" * 60)
    print("Simple MCP Agent Demo")
    print("=" * 60)
    print("\n⚠ Make sure MCP Market backend is running on http://localhost:3000")
    print("⚠ And at least one MCP server is configured\n")

    # 创建 Agent
    agent = SimpleAgent()

    try:
        # 初始化
        await agent.initialize()

        # 测试用例
        test_cases = [
            "北京的天气怎么样？",
            "帮我计算 123 加 456",
            "15 乘以 8 等于多少？",
            "把 'hello world' 转换成大写",
            "统计 'The quick brown fox' 有多少个单词",
        ]

        for user_input in test_cases:
            response = await agent.run(user_input)
            await asyncio.sleep(1)  # 稍微延迟，便于观察

        # 交互模式（可选）
        print("\n" + "=" * 60)
        print("Interactive Mode (type 'quit' to exit)")
        print("=" * 60)

        while True:
            try:
                user_input = input("\nYou: ").strip()
                if user_input.lower() in ["quit", "exit", "q"]:
                    break
                if user_input:
                    await agent.run(user_input)
            except KeyboardInterrupt:
                break

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await agent.close()
        print("\n✓ Agent closed")


if __name__ == "__main__":
    asyncio.run(main())
