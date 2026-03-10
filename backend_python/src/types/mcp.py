from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, Field


class ConnectionType(str, Enum):
    HTTP = "http"
    SSE = "sse"
    STDIO = "stdio"


class ServerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


# Connection Configs
class HttpConfig(BaseModel):
    type: Literal["http"] = "http"
    url: str
    timeout: Optional[int] = 10000


class SseConfig(BaseModel):
    type: Literal["sse"] = "sse"
    url: str
    timeout: Optional[int] = 10000


class StdioConfig(BaseModel):
    type: Literal["stdio"] = "stdio"
    command: str
    args: Optional[list[str]] = None
    env: Optional[dict[str, str]] = None


ConnectionConfig = Union[HttpConfig, SseConfig, StdioConfig]


# MCP Server Models
class McpServerBase(BaseModel):
    name: str
    description: Optional[str] = None
    connection_type: ConnectionType
    connection_config: ConnectionConfig
    status: ServerStatus = ServerStatus.ACTIVE
    path_prefix: Optional[str] = Field(None, pattern=r'^[a-z0-9-]+$', min_length=3, max_length=50)


class McpServerCreate(McpServerBase):
    pass


class McpServerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    connection_type: Optional[ConnectionType] = None
    connection_config: Optional[ConnectionConfig] = None
    status: Optional[ServerStatus] = None
    path_prefix: Optional[str] = Field(None, pattern=r'^[a-z0-9-]+$', min_length=3, max_length=50)


class McpServer(McpServerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Test Result Models
class ServerInfo(BaseModel):
    name: str
    version: str
    protocol_version: Optional[str] = None


class Tool(BaseModel):
    name: str
    description: Optional[str] = None
    input_schema: Optional[dict] = None


class Resource(BaseModel):
    uri: str
    name: Optional[str] = None
    description: Optional[str] = None


class Prompt(BaseModel):
    name: str
    description: Optional[str] = None
    arguments: Optional[list[dict]] = None


class Capabilities(BaseModel):
    tools: Optional[list[Tool]] = None
    resources: Optional[list[Resource]] = None
    prompts: Optional[list[Prompt]] = None


class McpTestResult(BaseModel):
    success: bool
    message: str
    error: Optional[str] = None
    server_info: Optional[ServerInfo] = None
    capabilities: Optional[Capabilities] = None


# Session Models
class SessionInfo(BaseModel):
    session_id: str
    server_id: int
    created_at: datetime
    last_activity_at: datetime


# Tool Call Models
class ToolCallRequest(BaseModel):
    tool_name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class ToolCallResult(BaseModel):
    success: bool
    content: Optional[Any] = None
    error: Optional[str] = None


# Resource Models
class ResourceReadResult(BaseModel):
    success: bool
    contents: Optional[list[Any]] = None
    error: Optional[str] = None


# Prompt Models
class PromptGetRequest(BaseModel):
    prompt_name: str
    arguments: Optional[dict[str, Any]] = None


class PromptGetResult(BaseModel):
    success: bool
    messages: Optional[list[Any]] = None
    error: Optional[str] = None


# Token Models
class TokenCreate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[list[str]] = None
    expires_at: Optional[datetime] = None


class Token(BaseModel):
    id: int
    token: str
    server_id: int
    name: Optional[str] = None
    permissions: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime


# HTTP Mapping Models
class HttpMapping(BaseModel):
    id: int
    server_id: int
    tool_name: str
    tool_description: Optional[str] = None
    http_method: str
    http_url: str
    http_headers: Optional[str] = None
    input_schema: str
    response_mapping: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class HttpMappingCreate(BaseModel):
    tool_name: str
    tool_description: Optional[str] = None
    http_method: str
    http_url: str
    http_headers: Optional[dict[str, str]] = None
    input_schema: dict
    response_mapping: Optional[dict[str, str]] = None


class HttpMappingUpdate(BaseModel):
    tool_description: Optional[str] = None
    http_method: Optional[str] = None
    http_url: Optional[str] = None
    http_headers: Optional[dict[str, str]] = None
    input_schema: Optional[dict] = None
    response_mapping: Optional[dict[str, str]] = None


# Access Log Models
class AccessLog(BaseModel):
    id: int
    server_id: int
    token_id: Optional[int] = None
    action: str
    tool_name: Optional[str] = None
    resource_uri: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None
    timestamp: datetime
