import anyio
import logging
from mcp.server.fastmcp import FastMCP, Context

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


if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
    )