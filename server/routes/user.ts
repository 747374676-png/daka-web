import { Router, type Request, type Response } from 'express';
import { userExists, getUserData, createUser } from '../db.js'; // 👈 这里改成 ../db.js
import { logger } from '@lark-apaas/client-toolkit-lite';

export const userRoutes = Router();

userRoutes.post('/verify', async (req: Request, res: Response) => {
  try {
    const { syncCode } = req.body;
    if (!syncCode || typeof syncCode !== 'string' || !syncCode.trim()) {
      res.status(400).json({ error: '同步码不能为空' });
      return;
    }
    const code = syncCode.trim();
    const exists = await userExists(code);
    if (exists) {
      const data = await getUserData(code);
      res.json({ exists: true, data });
    } else {
      res.json({ exists: false });
    }
  } catch (e) {
    logger.error('[user/verify] Error:', String(e));
    res.status(500).json({ error: '服务器内部错误' });
  }
});

userRoutes.post('/create', async (req: Request, res: Response) => {
  try {
    const { syncCode, initialData } = req.body;
    if (!syncCode || typeof syncCode !== 'string' || !syncCode.trim()) {
      res.status(400).json({ error: '同步码不能为空' });
      return;
    }
    const code = syncCode.trim();
    if (await userExists(code)) {
      res.status(409).json({ error: '该同步码已存在，请直接登录' });
      return;
    }
    const data = await createUser(code, initialData);
    res.json({ success: true, data });
  } catch (e) {
    logger.error('[user/create] Error:', String(e));
    res.status(500).json({ error: '服务器内部错误' });
  }
});
