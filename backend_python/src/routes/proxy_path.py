"""Path-based proxy routing for MCP servers"""
import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

from src.services.mcp_service import mcp_service

router = APIRouter(tags=["proxy-path"])

# Reserved path prefixes that cannot be used
RESERVED_PREFIXES = {"api", "admin", "proxy", "health", "docs", "redoc", "openapi.json"}


@router.api_route("/{path_prefix}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_by_path(path_prefix: str, path: str, request: Request):
    """
    Dynamic proxy routing based on path_prefix

    Example: /weather/mcp -> routes to server with path_prefix='weather'

    This allows transforming:
    - Original: http://10.23.56.64:8000/mcp
    - Proxied: http://10.23.24.25:4000/weather/mcp
    """
    # Check for reserved prefixes
    if path_prefix in RESERVED_PREFIXES:
        raise HTTPException(
            status_code=400,
            detail=f"Path prefix '{path_prefix}' is reserved and cannot be used"
        )

    # Lookup server by path_prefix
    server = mcp_service.get_by_path_prefix(path_prefix)
    if not server:
        raise HTTPException(
            status_code=404,
            detail=f"No MCP server found for path prefix: {path_prefix}"
        )

    # Check server type (only http/sse supported for path-based proxy)
    if server.connection_type.value not in ["http", "sse"]:
        raise HTTPException(
            status_code=400,
            detail=f"Path-based proxy only supports http/sse servers, but server '{server.name}' is type: {server.connection_type.value}"
        )

    # Build target URL
    # The path_prefix is only used to lookup the server
    # The actual target URL is the server's configured URL
    config = server.connection_config
    target_url = config.url

    # Prepare headers (exclude hop-by-hop headers)
    headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in ['host', 'connection', 'transfer-encoding', 'content-length']
    }

    # Get timeout from config
    timeout = getattr(config, 'timeout', 30000) / 1000  # Convert ms to seconds

    try:
        # Forward request
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=await request.body(),
                params=request.query_params,
                follow_redirects=False
            )

            # Prepare response headers (exclude hop-by-hop headers)
            response_headers = {
                k: v for k, v in response.headers.items()
                if k.lower() not in ['connection', 'transfer-encoding', 'content-length']
            }

            # Return response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=response_headers,
                media_type=response.headers.get('content-type')
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail=f"Request to upstream server timed out after {timeout}s"
        )
    except httpx.ConnectError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to upstream server: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Proxy error: {str(e)}"
        )
