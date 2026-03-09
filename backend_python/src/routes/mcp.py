import json
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException

from src.db.database import db
from src.services.mcp_service import mcp_service
from src.services.mcp_session_service import mcp_session_service
from src.services.mcp_test_service import mcp_test_service
from src.types.mcp import (
    HttpMappingCreate,
    HttpMappingUpdate,
    McpServerCreate,
    McpServerUpdate,
    PromptGetRequest,
    ResourceReadResult,
    ToolCallRequest,
    TokenCreate,
)

router = APIRouter(prefix="/api/mcps", tags=["mcp"])


# MCP Server CRUD
@router.get("")
async def get_all_mcps():
    """Get all MCP servers"""
    servers = mcp_service.get_all()
    return [s.model_dump() for s in servers]


@router.get("/{server_id}")
async def get_mcp_by_id(server_id: int):
    """Get MCP server by ID"""
    server = mcp_service.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    return server.model_dump()


@router.post("")
async def create_mcp(server: McpServerCreate):
    """Create new MCP server"""
    try:
        created = mcp_service.create(server)
        return created.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{server_id}")
async def update_mcp(server_id: int, update: McpServerUpdate):
    """Update MCP server"""
    updated = mcp_service.update(server_id, update)
    if not updated:
        raise HTTPException(status_code=404, detail="MCP server not found")
    return updated.model_dump()


@router.delete("/{server_id}")
async def delete_mcp(server_id: int):
    """Delete MCP server"""
    success = mcp_service.delete(server_id)
    if not success:
        raise HTTPException(status_code=404, detail="MCP server not found")
    return {"message": "MCP server deleted"}


# Test Connection
@router.post("/{server_id}/test")
async def test_mcp(server_id: int):
    """Test MCP server connection"""
    server = mcp_service.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")

    result = await mcp_test_service.test_connection(server.connection_config)
    return result.model_dump()


# Session Management
@router.post("/{server_id}/sessions")
async def create_session(server_id: int):
    """Create new session"""
    server = mcp_service.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")

    try:
        session_id = await mcp_session_service.create_session(server_id, server.connection_config)
        session_info = mcp_session_service.get_session_info(session_id)
        return session_info.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{server_id}/sessions/{session_id}")
async def close_session(server_id: int, session_id: str):
    """Close session"""
    try:
        await mcp_session_service.close_session(session_id)
        return {"message": "Session closed"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# Tool Operations
@router.post("/{server_id}/sessions/{session_id}/call-tool")
async def call_tool(server_id: int, session_id: str, request: ToolCallRequest):
    """Call tool in session"""
    try:
        result = await mcp_session_service.call_tool(session_id, request.tool_name, request.arguments)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Resource Operations
@router.get("/{server_id}/sessions/{session_id}/resources")
async def list_resources(server_id: int, session_id: str):
    """List resources in session"""
    try:
        resources = await mcp_session_service.list_resources(session_id)
        return {"resources": resources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{server_id}/sessions/{session_id}/resources/read")
async def read_resource(server_id: int, session_id: str, uri: str):
    """Read resource in session"""
    try:
        result = await mcp_session_service.read_resource(session_id, uri)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Prompt Operations
@router.get("/{server_id}/sessions/{session_id}/prompts")
async def list_prompts(server_id: int, session_id: str):
    """List prompts in session"""
    try:
        prompts = await mcp_session_service.list_prompts(session_id)
        return {"prompts": prompts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{server_id}/sessions/{session_id}/prompts/{prompt_name}")
async def get_prompt(server_id: int, session_id: str, prompt_name: str, request: dict):
    """Get prompt in session"""
    try:
        arguments = request.get("arguments")
        result = await mcp_session_service.get_prompt(session_id, prompt_name, arguments)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Token Management
@router.post("/{server_id}/tokens")
async def create_token(server_id: int, data: TokenCreate):
    """Create access token"""
    server = mcp_service.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")

    token = secrets.token_urlsafe(32)
    permissions_json = json.dumps(data.permissions) if data.permissions else None

    cursor = db.execute(
        """
        INSERT INTO mcp_access_tokens (token, server_id, name, permissions, expires_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (token, server_id, data.name, permissions_json, data.expires_at),
    )
    db.commit()

    return {
        "id": cursor.lastrowid,
        "token": token,
        "server_id": server_id,
        "name": data.name,
        "permissions": data.permissions,
        "expires_at": data.expires_at,
    }


@router.get("/{server_id}/tokens")
async def list_tokens(server_id: int):
    """List access tokens"""
    rows = db.fetchall("SELECT * FROM mcp_access_tokens WHERE server_id = ?", (server_id,))
    return [
        {
            "id": row["id"],
            "token": row["token"],
            "server_id": row["server_id"],
            "name": row["name"],
            "permissions": json.loads(row["permissions"]) if row["permissions"] else None,
            "expires_at": row["expires_at"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


@router.delete("/{server_id}/tokens/{token_id}")
async def delete_token(server_id: int, token_id: int):
    """Delete access token"""
    cursor = db.execute("DELETE FROM mcp_access_tokens WHERE id = ? AND server_id = ?", (token_id, server_id))
    db.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Token not found")

    return {"message": "Token deleted"}


# Access Logs
@router.get("/{server_id}/logs")
async def get_access_logs(server_id: int, limit: int = 100, offset: int = 0):
    """Get access logs"""
    rows = db.fetchall(
        """
        SELECT * FROM mcp_access_logs
        WHERE server_id = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
        """,
        (server_id, limit, offset),
    )

    total = db.fetchone("SELECT COUNT(*) as count FROM mcp_access_logs WHERE server_id = ?", (server_id,))

    return {"logs": rows, "total": total["count"] if total else 0}


# HTTP Mappings
@router.post("/{server_id}/http-mappings")
async def create_http_mapping(server_id: int, data: HttpMappingCreate):
    """Create HTTP to MCP mapping"""
    server = mcp_service.get_by_id(server_id)
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")

    headers_json = json.dumps(data.http_headers) if data.http_headers else None
    input_schema_json = json.dumps(data.input_schema)
    response_mapping_json = json.dumps(data.response_mapping) if data.response_mapping else None

    cursor = db.execute(
        """
        INSERT INTO http_to_mcp_mappings
        (server_id, tool_name, tool_description, http_method, http_url, http_headers, input_schema, response_mapping)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            server_id,
            data.tool_name,
            data.tool_description,
            data.http_method,
            data.http_url,
            headers_json,
            input_schema_json,
            response_mapping_json,
        ),
    )
    db.commit()

    return {"id": cursor.lastrowid, "message": "HTTP mapping created"}


@router.get("/{server_id}/http-mappings")
async def list_http_mappings(server_id: int):
    """List HTTP to MCP mappings"""
    rows = db.fetchall("SELECT * FROM http_to_mcp_mappings WHERE server_id = ?", (server_id,))
    return {
        "mappings": [
            {
                "id": row["id"],
                "server_id": row["server_id"],
                "tool_name": row["tool_name"],
                "tool_description": row["tool_description"],
                "http_method": row["http_method"],
                "http_url": row["http_url"],
                "http_headers": json.loads(row["http_headers"]) if row["http_headers"] else None,
                "input_schema": json.loads(row["input_schema"]),
                "response_mapping": json.loads(row["response_mapping"]) if row["response_mapping"] else None,
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]
    }


@router.put("/{server_id}/http-mappings/{mapping_id}")
async def update_http_mapping(server_id: int, mapping_id: int, data: HttpMappingUpdate):
    """Update HTTP to MCP mapping"""
    updates = []
    params = []

    if data.tool_description is not None:
        updates.append("tool_description = ?")
        params.append(data.tool_description)

    if data.http_method is not None:
        updates.append("http_method = ?")
        params.append(data.http_method)

    if data.http_url is not None:
        updates.append("http_url = ?")
        params.append(data.http_url)

    if data.http_headers is not None:
        updates.append("http_headers = ?")
        params.append(json.dumps(data.http_headers))

    if data.input_schema is not None:
        updates.append("input_schema = ?")
        params.append(json.dumps(data.input_schema))

    if data.response_mapping is not None:
        updates.append("response_mapping = ?")
        params.append(json.dumps(data.response_mapping))

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    params.extend([mapping_id, server_id])
    query = f"UPDATE http_to_mcp_mappings SET {', '.join(updates)} WHERE id = ? AND server_id = ?"

    cursor = db.execute(query, tuple(params))
    db.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="HTTP mapping not found")

    return {"message": "HTTP mapping updated"}


@router.delete("/{server_id}/http-mappings/{mapping_id}")
async def delete_http_mapping(server_id: int, mapping_id: int):
    """Delete HTTP to MCP mapping"""
    cursor = db.execute(
        "DELETE FROM http_to_mcp_mappings WHERE id = ? AND server_id = ?", (mapping_id, server_id)
    )
    db.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="HTTP mapping not found")

    return {"message": "HTTP mapping deleted"}
