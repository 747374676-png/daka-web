import type { Plugin } from 'vite';
import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/user';
import { dataRoutes } from './routes/data';

/**
 * Vite 插件：将 Express API 路由挂载到 Vite dev server 上。
 * 前端请求 /api/* 由 Vite 直接转发给内嵌的 Express 处理，
 * 无需单独启动后端进程，开发和生产环境均可用。
 */
export function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      const app = express();
      app.use(cors());
      app.use(express.json({ limit: '10mb' }));

      // 挂载 API 路由
      app.use('/api/user', userRoutes);
      app.use('/api/data', dataRoutes);

      // 健康检查
      app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
      });

      // 将 Express 作为 Vite 中间件挂载
      server.middlewares.use(app);
    },
  };
}
