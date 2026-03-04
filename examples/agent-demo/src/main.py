"""Main entry point for the MCP Agent demo."""
import asyncio
import os
from dotenv import load_dotenv

from .mcp_client import McpClient
from .agent import McpAgent


# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")
MCP_SERVER_URLS = os.getenv("MCP_SERVER_URLS", "http://localhost:3001/mcp")


async def main():
    """Main function."""
    print("🤖 MCP Agent Demo")
    print("==================\n")

    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not found in environment variables")
        print("Please create a .env file with your OpenAI API key")
        return

    # Parse MCP server URLs (support multiple servers)
    server_urls = [url.strip() for url in MCP_SERVER_URLS.split(",")]

    # Initialize MCP Clients
    mcp_clients = []
    for url in server_urls:
        print(f"Connecting to MCP Server at {url}...")
        client = McpClient(url)
        try:
            await client.connect()
            mcp_clients.append(client)
        except Exception as e:
            print(f"Failed to connect to {url}: {e}")
            print("Make sure the MCP Server is running:")
            print("  cd examples/mcp-server")
            print("  python -m src.server")
            continue

    if not mcp_clients:
        print("\nNo MCP servers connected. Exiting.")
        return

    # Initialize Agent
    print("\nInitializing agent...")
    agent = McpAgent(mcp_clients, OPENAI_API_KEY, OPENAI_BASE_URL)
    await agent.initialize()

    print("\n✅ Agent ready! Type your questions or commands.")
    print('Type "exit" or "quit" to exit.\n')

    # Interactive loop
    try:
        while True:
            user_input = input("> ").strip()

            if not user_input:
                continue

            if user_input.lower() in ["exit", "quit"]:
                print("\nGoodbye! 👋")
                break

            try:
                print("\n🤔 Thinking...\n")
                response = await agent.run(user_input)
                print(f"\n💬 {response}\n")
            except Exception as e:
                print(f"\n❌ Error: {e}\n")

    except KeyboardInterrupt:
        print("\n\nGoodbye! 👋")
    finally:
        # Close all MCP clients
        for client in mcp_clients:
            await client.close()


if __name__ == "__main__":
    asyncio.run(main())
