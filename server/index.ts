import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/user.js'; // 👈 这里加上 .js
import { dataRoutes } from './routes/data.js'; // 👈 这里加上 .js
import { logger } from '@lark-apaas/client-toolkit-lite';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// 开启全局 CORS，允许我们以后部署在任何域名上的前端访问后端
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/user', userRoutes);
app.use('/api/data', dataRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`[Server] 奖励打卡后端服务已启动 → 端口 ${PORT}`);
});
