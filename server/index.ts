import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { userRoutes } from './routes/user.js';
import { dataRoutes } from './routes/data.js';

// 获取当前文件路径（ESM 规范必须要加的这两行）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// 开启全局 CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ==============================
// 1. 后端 API 接口部分
// ==============================
app.use('/api/user', userRoutes);
app.use('/api/data', dataRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==============================
// 2. 前端网页界面部分 (新增)
// ==============================
// 告诉后端：前端打包好的文件存放在上一级的 dist 文件夹里
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// 捕获所有非 API 的请求，把前端的 index.html 网页发给用户
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ==============================
// 3. 启动服务器
// ==============================
app.listen(PORT, () => {
  console.log(`[Server] 奖励打卡后端服务已启动 → 端口 ${PORT}`);
});
