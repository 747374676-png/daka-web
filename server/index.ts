import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/user.js';
import { dataRoutes } from './routes/data.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// 开启全局 CORS
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
  console.log(`[Server] 奖励打卡后端服务已启动 → 端口 ${PORT}`);
});
