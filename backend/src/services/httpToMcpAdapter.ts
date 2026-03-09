import axios from 'axios';
import Database from 'better-sqlite3';
import { join } from 'path';
import JSONPath from 'jsonpath';

const dbPath = join(__dirname, '../../data/mcp-market.db');
const db = new Database(dbPath);

interface HttpToMcpMapping {
  id: number;
  server_id: number;
  tool_name: string;
  tool_description: string | null;
  http_method: string;
  http_url: string;
  http_headers: string | null;
  input_schema: string;
  response_mapping: string | null;
  created_at: string;
  updated_at: string;
}

export class HttpToMcpAdapter {
  // Get all mappings for a server
  getMappings(serverId: number): HttpToMcpMapping[] {
    const stmt = db.prepare('SELECT * FROM http_to_mcp_mappings WHERE server_id = ?');
    return stmt.all(serverId) as HttpToMcpMapping[];
  }

  // Get tools list for MCP protocol
  getTools(serverId: number): Array<{ name: string; description?: string; inputSchema: any }> {
    const mappings = this.getMappings(serverId);
    return mappings.map((mapping) => ({
      name: mapping.tool_name,
      description: mapping.tool_description || undefined,
      inputSchema: JSON.parse(mapping.input_schema),
    }));
  }

  // Call a tool (execute HTTP request)
  async callTool(serverId: number, toolName: string, args: Record<string, any>): Promise<any> {
    const stmt = db.prepare(
      'SELECT * FROM http_to_mcp_mappings WHERE server_id = ? AND tool_name = ?'
    );
    const mapping = stmt.get(serverId, toolName) as HttpToMcpMapping | undefined;

    if (!mapping) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    // Parse headers and replace variables
    let headers: Record<string, string> = {};
    if (mapping.http_headers) {
      headers = JSON.parse(mapping.http_headers);
      headers = this.replaceVariables(headers, args);
    }

    // Replace variables in URL
    let url = this.replaceVariables(mapping.http_url, args);

    // Prepare request config
    const config: any = {
      method: mapping.http_method,
      url,
      headers,
    };

    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(mapping.http_method)) {
      config.data = args;
    } else if (mapping.http_method === 'GET') {
      // Add query parameters for GET
      config.params = args;
    }

    try {
      const response = await axios(config);

      // Apply response mapping if configured
      if (mapping.response_mapping) {
        const mappingConfig = JSON.parse(mapping.response_mapping);
        const result: Record<string, any> = {};

        for (const [key, jsonPath] of Object.entries(mappingConfig)) {
          const values = JSONPath.query(response.data, jsonPath as string);
          result[key] = values.length === 1 ? values[0] : values;
        }

        return result;
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `HTTP request failed: ${error.response?.status} ${error.response?.statusText}`
        );
      }
      throw error;
    }
  }

  // Replace variables in string or object
  private replaceVariables(input: any, args: Record<string, any>): any {
    if (typeof input === 'string') {
      // Replace ${arg.name} with actual values
      return input.replace(/\$\{arg\.(\w+)\}/g, (_, key) => {
        return args[key] !== undefined ? String(args[key]) : '';
      });
    } else if (typeof input === 'object' && input !== null) {
      const result: any = Array.isArray(input) ? [] : {};
      for (const [key, value] of Object.entries(input)) {
        result[key] = this.replaceVariables(value, args);
      }
      return result;
    }
    return input;
  }

  // Create a new mapping
  createMapping(data: {
    serverId: number;
    toolName: string;
    toolDescription?: string;
    httpMethod: string;
    httpUrl: string;
    httpHeaders?: Record<string, string>;
    inputSchema: any;
    responseMapping?: Record<string, string>;
  }): HttpToMcpMapping {
    const stmt = db.prepare(`
      INSERT INTO http_to_mcp_mappings (
        server_id, tool_name, tool_description, http_method, http_url,
        http_headers, input_schema, response_mapping
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.serverId,
      data.toolName,
      data.toolDescription || null,
      data.httpMethod,
      data.httpUrl,
      data.httpHeaders ? JSON.stringify(data.httpHeaders) : null,
      JSON.stringify(data.inputSchema),
      data.responseMapping ? JSON.stringify(data.responseMapping) : null
    );

    const getStmt = db.prepare('SELECT * FROM http_to_mcp_mappings WHERE id = ?');
    return getStmt.get(result.lastInsertRowid) as HttpToMcpMapping;
  }

  // Update a mapping
  updateMapping(
    id: number,
    data: {
      toolName?: string;
      toolDescription?: string;
      httpMethod?: string;
      httpUrl?: string;
      httpHeaders?: Record<string, string>;
      inputSchema?: any;
      responseMapping?: Record<string, string>;
    }
  ): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.toolName !== undefined) {
      updates.push('tool_name = ?');
      values.push(data.toolName);
    }
    if (data.toolDescription !== undefined) {
      updates.push('tool_description = ?');
      values.push(data.toolDescription);
    }
    if (data.httpMethod !== undefined) {
      updates.push('http_method = ?');
      values.push(data.httpMethod);
    }
    if (data.httpUrl !== undefined) {
      updates.push('http_url = ?');
      values.push(data.httpUrl);
    }
    if (data.httpHeaders !== undefined) {
      updates.push('http_headers = ?');
      values.push(JSON.stringify(data.httpHeaders));
    }
    if (data.inputSchema !== undefined) {
      updates.push('input_schema = ?');
      values.push(JSON.stringify(data.inputSchema));
    }
    if (data.responseMapping !== undefined) {
      updates.push('response_mapping = ?');
      values.push(JSON.stringify(data.responseMapping));
    }

    if (updates.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE http_to_mcp_mappings SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  // Delete a mapping
  deleteMapping(id: number): void {
    const stmt = db.prepare('DELETE FROM http_to_mcp_mappings WHERE id = ?');
    stmt.run(id);
  }
}

export const httpToMcpAdapter = new HttpToMcpAdapter();
