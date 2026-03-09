import { Response } from 'express';
import { mcpProxyService } from '../services/mcpProxyService';
import type { AuthenticatedRequest } from '../middleware/proxyAuth';

export class ProxyController {
  // GET /proxy/:serverId/mcp - SSE proxy endpoint
  async handleProxyConnection(req: AuthenticatedRequest, res: Response) {
    const serverId = parseInt(req.params.serverId);
    if (isNaN(serverId)) {
      return res.status(400).json({ error: 'Invalid server ID' });
    }

    await mcpProxyService.handleProxyRequest(req, res, serverId);
  }

  // POST /proxy/:serverId/mcp/messages/ - SSE POST messages endpoint
  async handleProxyMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const serverId = parseInt(req.params.serverId);
      if (isNaN(serverId)) {
        return res.status(400).json({ error: 'Invalid server ID' });
      }

      if (!req.tokenInfo) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Handle different message types
      const { method, params } = req.body;

      if (method === 'tools/call') {
        const result = await mcpProxyService.callToolViaProxy(
          serverId,
          req.tokenInfo.id,
          params.name,
          params.arguments || {}
        );
        res.json(result);
      } else {
        res.status(400).json({ error: 'Unsupported method' });
      }
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const proxyController = new ProxyController();
