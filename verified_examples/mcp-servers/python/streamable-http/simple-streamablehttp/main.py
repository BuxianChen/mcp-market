import anyio
import logging
from mcp.server.fastmcp import FastMCP, Context
from starlette.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

# 创建 FastMCP server
mcp = FastMCP(
    "mcp-streamable-http-demo",
    stateless_http=True,
)

@mcp.tool()
async def start_notification_stream(
    interval: float,
    count: int,
    caller: str,
    ctx: Context
) -> str:
    """Send a stream of notifications"""

    # for i in range(count):
    #     msg = f"[{i+1}/{count}] Event from '{caller}'"

    #     await ctx.session.send_log_message(
    #         level="info",
    #         data=msg,
    #         logger="notification_stream",
    #         related_request_id=ctx.request_id,
    #     )

    #     logger.info(msg)

    #     if i < count - 1:
    #         await anyio.sleep(interval)

    # await ctx.session.send_resource_updated(
    #     uri="http:///test_resource"
    # )

    return f"Sent {count} notifications with {interval}s interval"


async def run_streamable_http_async(mcp) -> None:  # pragma: no cover
    """Run the server using StreamableHTTP transport."""
    import uvicorn

    starlette_app = mcp.streamable_http_app()

    starlette_app = CORSMiddleware(
        starlette_app,
        allow_origins=["*"],  # Allow all origins - adjust as needed for production
        allow_credentials=True,
        allow_methods=["*"],  # MCP streamable HTTP methods
        allow_headers=["*"],
        expose_headers=["Mcp-Session-Id"],
    )

    config = uvicorn.Config(
        starlette_app,
        host=mcp.settings.host,
        port=mcp.settings.port,
        log_level=mcp.settings.log_level.lower(),
    )
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    anyio.run(run_streamable_http_async, mcp)