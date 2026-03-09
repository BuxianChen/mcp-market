import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(__dirname, '../../data/mcp-market.db');
const db = new Database(dbPath);

export interface AuthenticatedRequest extends Request {
  tokenInfo?: {
    id: number;
    token: string;
    server_id: number;
    name: string | null;
    permissions: string[];
    expires_at: string | null;
  };
}

export const proxyAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Query token from database
    const stmt = db.prepare(`
      SELECT id, token, server_id, name, permissions, expires_at
      FROM mcp_access_tokens
      WHERE token = ?
    `);
    const tokenInfo = stmt.get(token) as any;

    if (!tokenInfo) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if token is expired
    if (tokenInfo.expires_at) {
      const expiresAt = new Date(tokenInfo.expires_at);
      if (expiresAt < new Date()) {
        return res.status(401).json({ error: 'Token expired' });
      }
    }

    // Parse permissions
    const permissions = tokenInfo.permissions ? JSON.parse(tokenInfo.permissions) : [];

    // Attach token info to request
    req.tokenInfo = {
      ...tokenInfo,
      permissions,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Check if token has specific permission
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.tokenInfo) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.tokenInfo.permissions.includes(permission)) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }

    next();
  };
};
