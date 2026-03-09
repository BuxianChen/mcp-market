import json
import time
from datetime import datetime
from typing import Any, Optional

from src.db.database import db
from src.services.mcp_session_service import mcp_session_service
from src.types.mcp import ConnectionConfig


class McpProxyService:
    """Service for proxying MCP requests with authentication"""

    async def create_proxy_session(self, server_id: int, token_id: int, config: ConnectionConfig) -> str:
        """Create a proxy session for a token"""
        session_id = await mcp_session_service.create_session(server_id, config)
        return session_id

    async def proxy_tool_call(
        self, session_id: str, server_id: int, token_id: int, tool_name: str, arguments: dict[str, Any]
    ) -> dict:
        """Proxy tool call with logging"""
        start_time = time.time()

        try:
            result = await mcp_session_service.call_tool(session_id, tool_name, arguments)

            duration_ms = int((time.time() - start_time) * 1000)

            # Log access
            self._log_access(
                server_id=server_id,
                token_id=token_id,
                action="call_tool",
                tool_name=tool_name,
                status="success" if result.get("success") else "error",
                error_message=result.get("error"),
                duration_ms=duration_ms,
            )

            return result

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)

            self._log_access(
                server_id=server_id,
                token_id=token_id,
                action="call_tool",
                tool_name=tool_name,
                status="error",
                error_message=str(e),
                duration_ms=duration_ms,
            )

            return {"success": False, "error": str(e)}

    async def proxy_read_resource(
        self, session_id: str, server_id: int, token_id: int, resource_uri: str
    ) -> dict:
        """Proxy resource read with logging"""
        start_time = time.time()

        try:
            result = await mcp_session_service.read_resource(session_id, resource_uri)

            duration_ms = int((time.time() - start_time) * 1000)

            self._log_access(
                server_id=server_id,
                token_id=token_id,
                action="read_resource",
                resource_uri=resource_uri,
                status="success" if result.get("success") else "error",
                error_message=result.get("error"),
                duration_ms=duration_ms,
            )

            return result

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)

            self._log_access(
                server_id=server_id,
                token_id=token_id,
                action="read_resource",
                resource_uri=resource_uri,
                status="error",
                error_message=str(e),
                duration_ms=duration_ms,
            )

            return {"success": False, "error": str(e)}

    async def proxy_get_prompt(
        self, session_id: str, server_id: int, token_id: int, prompt_name: str, arguments: Optional[dict[str, Any]]
    ) -> dict:
        """Proxy prompt get with logging"""
        start_time = time.time()

        try:
            result = await mcp_session_service.get_prompt(session_id, prompt_name, arguments)

            duration_ms = int((time.time() - start_time) * 1000)

            self._log_access(
                server_id=server_id,
                token_id=token_id,
                action="get_prompt",
                tool_name=prompt_name,
                status="success" if result.get("success") else "error",
                error_message=result.get("error"),
                duration_ms=duration_ms,
            )

            return result

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)

            self._log_access(
                server_id=server_id,
                token_id=token_id,
                action="get_prompt",
                tool_name=prompt_name,
                status="error",
                error_message=str(e),
                duration_ms=duration_ms,
            )

            return {"success": False, "error": str(e)}

    def _log_access(
        self,
        server_id: int,
        token_id: int,
        action: str,
        status: str,
        tool_name: Optional[str] = None,
        resource_uri: Optional[str] = None,
        error_message: Optional[str] = None,
        duration_ms: Optional[int] = None,
    ):
        """Log access to database"""
        try:
            db.execute(
                """
                INSERT INTO mcp_access_logs
                (server_id, token_id, action, tool_name, resource_uri, status, error_message, duration_ms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (server_id, token_id, action, tool_name, resource_uri, status, error_message, duration_ms),
            )
            db.commit()
        except Exception as e:
            print(f"Failed to log access: {e}")


# Singleton instance
mcp_proxy_service = McpProxyService()
