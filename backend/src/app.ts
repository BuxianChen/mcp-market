import express from 'express';
import cors from 'cors';
import mcpRoutes from './routes/mcp';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', mcpRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
