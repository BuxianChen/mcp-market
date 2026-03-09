import { Router } from 'express';
import { proxyController } from '../controllers/proxyController';
import { proxyAuth } from '../middleware/proxyAuth';

const router = Router();

// All proxy routes require authentication
router.use(proxyAuth);

// SSE proxy endpoint
router.get('/proxy/:serverId/mcp', (req, res) => proxyController.handleProxyConnection(req, res));

// SSE POST messages endpoint
router.post('/proxy/:serverId/mcp/messages/', (req, res) => proxyController.handleProxyMessage(req, res));

export default router;
