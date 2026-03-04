import { Router } from 'express';
import { mcpController } from '../controllers/mcpController';

const router = Router();

router.get('/mcps', (req, res) => mcpController.getAllMcps(req, res));
router.get('/mcps/:id', (req, res) => mcpController.getMcpById(req, res));
router.post('/mcps', (req, res) => mcpController.createMcp(req, res));
router.put('/mcps/:id', (req, res) => mcpController.updateMcp(req, res));
router.delete('/mcps/:id', (req, res) => mcpController.deleteMcp(req, res));
router.post('/mcps/:id/test', (req, res) => mcpController.testMcp(req, res));

export default router;
