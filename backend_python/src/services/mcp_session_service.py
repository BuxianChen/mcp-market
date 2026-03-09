import asyncio
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from mcp import ClientSession, StdioServerParameters
from mcp.client.sse import sse_client
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamable_http_client

from src.types.mcp import ConnectionConfig, HttpConfig, SessionInfo, SseConfig, StdioConfig


class Session:
    """Represents an active MCP session"""

    def __init__(
        self,
        session_id: str,
        server_id: int,
        client_session: ClientSession,
        read_stream: Any,
        write_stream: Any,
    ):
        self.id = session_id
        self.server_id = server_id
        self.client_session = client_session
        self.read_stream = read_stream
        self.write_stream = write_stream
        self.created_at = datetime.now()
        self.last_activity_at = datetime.now()

    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity_at = datetime.now()


class McpSessionService:
    """Service for managing MCP client sessions"""

    MAX_SESSIONS_PER_SERVER = 5
    SESSION_TIMEOUT_MS = 30 * 60 * 1000  # 30 minutes

    def __init__(self):
        self.sessions: dict[str, Session] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start_cleanup(self):
        """Start background cleanup task"""
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        """Background task to cleanup expired sessions"""
        while True:
            await asyncio.sleep(5 * 60)  # Check every 5 minutes
            await self._cleanup_expired_sessions()

    async def _cleanup_expired_sessions(self):
        """Remove expired sessions"""
        now = datetime.now()
        expired = []

        for session_id, session in self.sessions.items():
            elapsed_ms = (now - session.last_activity_at).total_seconds() * 1000
            if elapsed_ms > self.SESSION_TIMEOUT_MS:
                expired.append(session_id)

        for session_id in expired:
            print(f"Cleaning up expired session: {session_id}")
            await self.close_session(session_id)

    async def create_session(self, server_id: int, config: ConnectionConfig) -> str:
        """Create new MCP session"""
        # Check session limit
        server_sessions = [s for s in self.sessions.values() if s.server_id == server_id]
        if len(server_sessions) >= self.MAX_SESSIONS_PER_SERVER:
            raise RuntimeError(f"Maximum {self.MAX_SESSIONS_PER_SERVER} sessions per server reached")

        session_id = str(uuid4())

        try:
            if isinstance(config, SseConfig):
                read_stream, write_stream = sse_client(config.url)
            elif isinstance(config, HttpConfig):
                read_stream, write_stream = streamable_http_client(config.url)
            elif isinstance(config, StdioConfig):
                server_params = StdioServerParameters(
                    command=config.command,
                    args=config.args or [],
                    env=config.env,
                )
                read_stream, write_stream = stdio_client(server_params)
            else:
                raise ValueError(f"Unsupported connection type: {type(config)}")

            async with ClientSession(read_stream, write_stream) as client_session:
                await client_session.initialize()

                session = Session(
                    session_id=session_id,
                    server_id=server_id,
                    client_session=client_session,
                    read_stream=read_stream,
                    write_stream=write_stream,
                )

                self.sessions[session_id] = session
                return session_id

        except Exception as e:
            raise RuntimeError(f"Failed to create session: {str(e)}")

    async def close_session(self, session_id: str):
        """Close MCP session"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")

        try:
            # Close streams
            if hasattr(session.write_stream, "close"):
                await session.write_stream.close()
            if hasattr(session.read_stream, "close"):
                await session.read_stream.close()
        except Exception as e:
            print(f"Error closing session: {e}")
        finally:
            del self.sessions[session_id]

    async def call_tool(self, session_id: str, tool_name: str, arguments: dict[str, Any]) -> dict:
        """Call tool in session"""
        session = self._get_session(session_id)

        try:
            result = await session.client_session.call_tool(tool_name, arguments)
            session.update_activity()

            return {"success": True, "content": result.content}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def list_resources(self, session_id: str) -> list[dict]:
        """List resources in session"""
        session = self._get_session(session_id)

        result = await session.client_session.list_resources()
        session.update_activity()

        return [
            {"uri": r.uri, "name": r.name, "description": r.description, "mimeType": r.mimeType}
            for r in result.resources
        ]

    async def read_resource(self, session_id: str, uri: str) -> dict:
        """Read resource in session"""
        session = self._get_session(session_id)

        try:
            result = await session.client_session.read_resource(uri)
            session.update_activity()

            return {"success": True, "contents": result.contents}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def list_prompts(self, session_id: str) -> list[dict]:
        """List prompts in session"""
        session = self._get_session(session_id)

        result = await session.client_session.list_prompts()
        session.update_activity()

        return [
            {"name": p.name, "description": p.description, "arguments": p.arguments} for p in result.prompts
        ]

    async def get_prompt(self, session_id: str, prompt_name: str, arguments: Optional[dict[str, Any]] = None) -> dict:
        """Get prompt in session"""
        session = self._get_session(session_id)

        try:
            result = await session.client_session.get_prompt(prompt_name, arguments or {})
            session.update_activity()

            return {"success": True, "messages": result.messages}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_session_info(self, session_id: str) -> SessionInfo:
        """Get session info"""
        session = self._get_session(session_id)

        return SessionInfo(
            session_id=session.id,
            server_id=session.server_id,
            created_at=session.created_at,
            last_activity_at=session.last_activity_at,
        )

    def _get_session(self, session_id: str) -> Session:
        """Get session or raise error"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        return session

    async def cleanup(self):
        """Cleanup all sessions"""
        if self._cleanup_task:
            self._cleanup_task.cancel()

        for session_id in list(self.sessions.keys()):
            await self.close_session(session_id)


# Singleton instance
mcp_session_service = McpSessionService()
