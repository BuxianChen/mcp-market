from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from src.middleware.proxy_auth import check_permission, security, verify_token
from src.services.mcp_proxy_service import mcp_proxy_service
from src.services.mcp_service import mcp_service

router = APIRouter(prefix="/api/proxy", tags=["proxy"])


@router.post("/{server_id}/call-tool")
async def proxy_call_tool(
    server_id: int,
    tool_name: str,
    arguments: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Proxy tool call with authentication"""
    # Verify token
    token_data = await verify_token(credentials, server_id)
    check_permission(token_data, "tools")

    # Get server config
    server = mcp_service.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")

    # Create or reuse session (simplified - in production, manage session per token)
    session_id = f"proxy_{token_data.token_id}"

    try:
        result = await mcp_proxy_service.proxy_tool_call(
            session_id=session_id,
            server_id=server_id,
            token_id=token_data.token_id,
            tool_name=tool_name,
            arguments=arguments,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{server_id}/read-resource")
async def proxy_read_resource(
    server_id: int,
    uri: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Proxy resource read with authentication"""
    # Verify token
    token_data = await verify_token(credentials, server_id)
    check_permission(token_data, "resources")

    # Get server config
    server = mcp_service.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")

    # Create or reuse session
    session_id = f"proxy_{token_data.token_id}"

    try:
        result = await mcp_proxy_service.proxy_read_resource(
            session_id=session_id,
            server_id=server_id,
            token_id=token_data.token_id,
            resource_uri=uri,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{server_id}/get-prompt")
async def proxy_get_prompt(
    server_id: int,
    prompt_name: str,
    arguments: dict = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Proxy prompt get with authentication"""
    # Verify token
    token_data = await verify_token(credentials, server_id)
    check_permission(token_data, "prompts")

    # Get server config
    server = mcp_service.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")

    # Create or reuse session
    session_id = f"proxy_{token_data.token_id}"

    try:
        result = await mcp_proxy_service.proxy_get_prompt(
            session_id=session_id,
            server_id=server_id,
            token_id=token_data.token_id,
            prompt_name=prompt_name,
            arguments=arguments,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
