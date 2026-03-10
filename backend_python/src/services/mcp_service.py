import json
from typing import Optional

from src.db.database import db
from src.types.mcp import ConnectionConfig, McpServer, McpServerCreate, McpServerUpdate


class McpService:
    """Service for MCP server CRUD operations"""

    def get_all(self) -> list[McpServer]:
        """Get all MCP servers"""
        rows = db.fetchall("SELECT * FROM mcp_servers ORDER BY created_at DESC")
        return [self._row_to_server(row) for row in rows]

    def get_by_id(self, server_id: int) -> Optional[McpServer]:
        """Get MCP server by ID"""
        row = db.fetchone("SELECT * FROM mcp_servers WHERE id = ?", (server_id,))
        return self._row_to_server(row) if row else None

    def get_by_path_prefix(self, path_prefix: str) -> Optional[McpServer]:
        """Get MCP server by path prefix"""
        row = db.fetchone("SELECT * FROM mcp_servers WHERE path_prefix = ?", (path_prefix,))
        return self._row_to_server(row) if row else None

    def create(self, server: McpServerCreate) -> McpServer:
        """Create new MCP server"""
        connection_config_json = server.connection_config.model_dump_json()

        cursor = db.execute(
            """
            INSERT INTO mcp_servers (name, description, connection_type, connection_config, status, path_prefix)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                server.name,
                server.description,
                server.connection_type.value,
                connection_config_json,
                server.status.value,
                server.path_prefix,
            ),
        )
        db.commit()

        created = self.get_by_id(cursor.lastrowid)
        if not created:
            raise RuntimeError("Failed to create MCP server")
        return created

    def update(self, server_id: int, update: McpServerUpdate) -> Optional[McpServer]:
        """Update MCP server"""
        existing = self.get_by_id(server_id)
        if not existing:
            return None

        # Build update query dynamically
        updates = []
        params = []

        if update.name is not None:
            updates.append("name = ?")
            params.append(update.name)

        if update.description is not None:
            updates.append("description = ?")
            params.append(update.description)

        if update.connection_type is not None:
            updates.append("connection_type = ?")
            params.append(update.connection_type.value)

        if update.connection_config is not None:
            updates.append("connection_config = ?")
            params.append(update.connection_config.model_dump_json())

        if update.status is not None:
            updates.append("status = ?")
            params.append(update.status.value)

        if update.path_prefix is not None:
            updates.append("path_prefix = ?")
            params.append(update.path_prefix)

        if not updates:
            return existing

        params.append(server_id)
        query = f"UPDATE mcp_servers SET {', '.join(updates)} WHERE id = ?"

        db.execute(query, tuple(params))
        db.commit()

        return self.get_by_id(server_id)

    def delete(self, server_id: int) -> bool:
        """Delete MCP server"""
        cursor = db.execute("DELETE FROM mcp_servers WHERE id = ?", (server_id,))
        db.commit()
        return cursor.rowcount > 0

    def _row_to_server(self, row: dict) -> McpServer:
        """Convert database row to McpServer model"""
        connection_config = json.loads(row["connection_config"])

        return McpServer(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            connection_type=row["connection_type"],
            connection_config=connection_config,
            status=row["status"],
            path_prefix=row.get("path_prefix"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


# Singleton instance
mcp_service = McpService()
