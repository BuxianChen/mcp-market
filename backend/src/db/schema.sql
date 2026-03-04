CREATE TABLE IF NOT EXISTS mcp_servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  connection_type TEXT NOT NULL CHECK(connection_type IN ('http', 'stdio', 'sse')),
  connection_config TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_mcp_servers_timestamp
AFTER UPDATE ON mcp_servers
BEGIN
  UPDATE mcp_servers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
