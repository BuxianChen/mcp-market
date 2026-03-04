import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { McpServer, CreateMcpServerInput, UpdateMcpServerInput } from '../types/mcp';

const dbPath = join(__dirname, '../../data/mcp-market.db');
const db = new Database(dbPath);

// 初始化数据库
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

export class McpDatabase {
  // 获取所有 MCP Server
  getAllMcpServers(): McpServer[] {
    const stmt = db.prepare('SELECT * FROM mcp_servers ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      connection_config: JSON.parse(row.connection_config)
    }));
  }

  // 根据 ID 获取 MCP Server
  getMcpServerById(id: number): McpServer | null {
    const stmt = db.prepare('SELECT * FROM mcp_servers WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return {
      ...row,
      connection_config: JSON.parse(row.connection_config)
    };
  }

  // 创建 MCP Server
  createMcpServer(input: CreateMcpServerInput): McpServer {
    const stmt = db.prepare(`
      INSERT INTO mcp_servers (name, description, connection_type, connection_config, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      input.name,
      input.description || null,
      input.connection_type,
      JSON.stringify(input.connection_config),
      input.status || 'active'
    );
    const created = this.getMcpServerById(result.lastInsertRowid as number);
    if (!created) throw new Error('Failed to create MCP server');
    return created;
  }

  // 更新 MCP Server
  updateMcpServer(id: number, input: UpdateMcpServerInput): McpServer | null {
    const existing = this.getMcpServerById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.connection_type !== undefined) {
      updates.push('connection_type = ?');
      values.push(input.connection_type);
    }
    if (input.connection_config !== undefined) {
      updates.push('connection_config = ?');
      values.push(JSON.stringify(input.connection_config));
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    const stmt = db.prepare(`UPDATE mcp_servers SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getMcpServerById(id);
  }

  // 删除 MCP Server
  deleteMcpServer(id: number): boolean {
    const stmt = db.prepare('DELETE FROM mcp_servers WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export const mcpDatabase = new McpDatabase();
