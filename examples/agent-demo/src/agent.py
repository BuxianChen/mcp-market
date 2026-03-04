"""LangGraph Agent implementation using MCP tools."""
from typing import Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode

from .mcp_client import McpClient, McpTool


class AgentState(TypedDict):
    """State for the agent graph."""
    messages: Annotated[Sequence[BaseMessage], "The messages in the conversation"]


class McpAgent:
    """Agent that uses MCP tools via LangGraph."""

    def __init__(self, mcp_clients: list[McpClient], openai_api_key: str, base_url: str | None = None):
        self.mcp_clients = mcp_clients
        self.tools = []
        self.graph = None

        # Initialize LLM
        llm_kwargs = {
            "model": "gpt-5.2-mini",
            "temperature": 0,
            "api_key": openai_api_key,
        }
        if base_url:
            llm_kwargs["base_url"] = base_url

        self.llm = ChatOpenAI(**llm_kwargs)

    async def initialize(self) -> None:
        """Initialize the agent by loading tools from MCP servers."""
        # Collect tools from all MCP servers
        for client in self.mcp_clients:
            mcp_tools = await client.list_tools()
            print(f"Loaded {len(mcp_tools)} tools from {client.server_url}")

            # Convert MCP tools to LangChain tools
            for mcp_tool in mcp_tools:
                self.tools.append(self._create_langchain_tool(client, mcp_tool))

        # Bind tools to LLM
        llm_with_tools = self.llm.bind_tools(self.tools)

        # Define the agent node
        async def agent_node(state: AgentState) -> dict:
            response = await llm_with_tools.ainvoke(state["messages"])
            return {"messages": [response]}

        # Define routing logic
        def should_continue(state: AgentState) -> str:
            last_message = state["messages"][-1]
            if hasattr(last_message, "tool_calls") and last_message.tool_calls:
                return "tools"
            return END

        # Build the graph
        workflow = StateGraph(AgentState)

        # Add nodes
        workflow.add_node("agent", agent_node)
        workflow.add_node("tools", ToolNode(self.tools))

        # Add edges
        workflow.add_edge(START, "agent")
        workflow.add_conditional_edges("agent", should_continue, {
            "tools": "tools",
            END: END
        })
        workflow.add_edge("tools", "agent")

        self.graph = workflow.compile()

    def _create_langchain_tool(self, client: McpClient, mcp_tool: McpTool):
        """Create a LangChain tool from an MCP tool."""

        # Create tool with description in the decorator
        @tool(mcp_tool.name, return_direct=False)
        async def dynamic_tool(**kwargs) -> str:
            """
            Tool function dynamically created from MCP tool.

            Args:
                **kwargs: Tool arguments matching the schema
            """
            print(f"Calling tool: {mcp_tool.name} with args: {kwargs}")
            result = await client.call_tool(mcp_tool.name, kwargs)
            print(f"Tool result: {result}")
            return result

        # Set the tool description
        dynamic_tool.description = mcp_tool.description

        return dynamic_tool

    async def run(self, user_input: str) -> str:
        """Run the agent with user input."""
        if not self.graph:
            raise RuntimeError("Agent not initialized. Call initialize() first.")

        initial_state = AgentState(messages=[HumanMessage(content=user_input)])
        result = await self.graph.ainvoke(initial_state)

        last_message = result["messages"][-1]
        return last_message.content
