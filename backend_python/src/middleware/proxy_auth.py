import json
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.db.database import db


class TokenData:
    """Token data from database"""

    def __init__(self, token_id: int, server_id: int, permissions: Optional[list[str]] = None):
        self.token_id = token_id
        self.server_id = server_id
        self.permissions = permissions or []


security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials, server_id: int) -> TokenData:
    """Verify access token and check permissions"""
    token = credentials.credentials

    # Query token from database
    row = db.fetchone(
        """
        SELECT id, server_id, permissions, expires_at
        FROM mcp_access_tokens
        WHERE token = ? AND server_id = ?
        """,
        (token, server_id),
    )

    if not row:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Check expiration
    if row["expires_at"]:
        expires_at = datetime.fromisoformat(row["expires_at"])
        if datetime.now() > expires_at:
            raise HTTPException(status_code=401, detail="Token expired")

    # Parse permissions
    permissions = []
    if row["permissions"]:
        try:
            permissions = json.loads(row["permissions"])
        except Exception:
            pass

    return TokenData(token_id=row["id"], server_id=row["server_id"], permissions=permissions)


def check_permission(token_data: TokenData, required_permission: str):
    """Check if token has required permission"""
    if required_permission not in token_data.permissions:
        raise HTTPException(status_code=403, detail=f"Permission '{required_permission}' required")
