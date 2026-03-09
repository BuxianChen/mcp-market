import { Router } from 'express';
import { mcpController } from '../controllers/mcpController';

const router = Router();

// MCP Server CRUD
router.get('/mcps', (req, res) => mcpController.getAllMcps(req, res));
router.get('/mcps/:id', (req, res) => mcpController.getMcpById(req, res));
router.post('/mcps', (req, res) => mcpController.createMcp(req, res));
router.put('/mcps/:id', (req, res) => mcpController.updateMcp(req, res));
router.delete('/mcps/:id', (req, res) => mcpController.deleteMcp(req, res));
router.post('/mcps/:id/test', (req, res) => mcpController.testMcp(req, res));

// Session Management
router.post('/mcps/:id/sessions', (req, res) => mcpController.createSession(req, res));
router.delete('/mcps/:id/sessions/:sessionId', (req, res) => mcpController.closeSession(req, res));

// Interactive Testing
router.post('/mcps/:id/sessions/:sessionId/call-tool', (req, res) => mcpController.callTool(req, res));
router.get('/mcps/:id/sessions/:sessionId/resources', (req, res) => mcpController.listResources(req, res));
router.get('/mcps/:id/sessions/:sessionId/resources/read', (req, res) => mcpController.readResource(req, res));
router.get('/mcps/:id/sessions/:sessionId/prompts', (req, res) => mcpController.listPrompts(req, res));
router.post('/mcps/:id/sessions/:sessionId/prompts/:promptName', (req, res) => mcpController.getPrompt(req, res));

// Token Management
router.post('/mcps/:id/tokens', (req, res) => mcpController.createToken(req, res));
router.get('/mcps/:id/tokens', (req, res) => mcpController.listTokens(req, res));
router.delete('/mcps/:id/tokens/:tokenId', (req, res) => mcpController.deleteToken(req, res));

// Access Logs
router.get('/mcps/:id/logs', (req, res) => mcpController.getAccessLogs(req, res));

// HTTP to MCP Mappings
router.post('/mcps/:id/http-mappings', (req, res) => mcpController.createHttpMapping(req, res));
router.get('/mcps/:id/http-mappings', (req, res) => mcpController.listHttpMappings(req, res));
router.put('/mcps/:id/http-mappings/:mappingId', (req, res) => mcpController.updateHttpMapping(req, res));
router.delete('/mcps/:id/http-mappings/:mappingId', (req, res) => mcpController.deleteHttpMapping(req, res));

export default router;
