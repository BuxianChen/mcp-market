CREATE TABLE IF NOT EXISTS mcp_servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  connection_type TEXT NOT NULL CHECK(connection_type IN ('http', 'stdio', 'sse')),
  connection_config TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  path_prefix TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_mcp_servers_timestamp
AFTER UPDATE ON mcp_servers
BEGIN
  UPDATE mcp_servers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Access tokens table
CREATE TABLE IF NOT EXISTS mcp_access_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  server_id INTEGER NOT NULL,
  name TEXT,
  permissions TEXT, -- JSON: ["tools", "resources", "prompts"]
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE
);

-- Access logs table
CREATE TABLE IF NOT EXISTS mcp_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER NOT NULL,
  token_id INTEGER,
  action TEXT NOT NULL, -- "call_tool", "read_resource", "get_prompt"
  tool_name TEXT,
  resource_uri TEXT,
  status TEXT NOT NULL, -- "success", "error"
  error_message TEXT,
  duration_ms INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE,
  FOREIGN KEY (token_id) REFERENCES mcp_access_tokens(id) ON DELETE SET NULL
);

-- HTTP to MCP mappings table
CREATE TABLE IF NOT EXISTS http_to_mcp_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  tool_description TEXT,
  http_method TEXT NOT NULL CHECK(http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  http_url TEXT NOT NULL,
  http_headers TEXT, -- JSON: {"Authorization": "Bearer ${env.API_TOKEN}"}
  input_schema TEXT NOT NULL, -- JSON Schema
  response_mapping TEXT, -- JSON: {"result": "$.data.result"}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE,
  UNIQUE(server_id, tool_name)
);

CREATE TRIGGER IF NOT EXISTS update_http_mappings_timestamp
AFTER UPDATE ON http_to_mcp_mappings
BEGIN
  UPDATE http_to_mcp_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_server_id ON mcp_access_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON mcp_access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_tokens_server_id ON mcp_access_tokens(server_id);
CREATE INDEX IF NOT EXISTS idx_http_mappings_server_id ON http_to_mcp_mappings(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_path_prefix ON mcp_servers(path_prefix);
