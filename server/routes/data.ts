import { Router, type Request, type Response } from 'express';
import { getUserData, updateUserData } from '../db.js'; // 👈 这里改成 ../db.js

export const dataRoutes = Router();

dataRoutes.get('/:syncCode', async (req: Request, res: Response) => {
  try {
    const { syncCode } = req.params;
    if (!syncCode) {
      res.status(400).json({ error: '同步码不能为空' });
      return;
    }
    const data = await getUserData(syncCode);
    if (!data) {
      res.status(404).json({ error: '用户不存在，请先创建账号' });
      return;
    }
    res.json(data);
  } catch (e) {
    console.error('[data/get] Error:', String(e));
    res.status(500).json({ error: '服务器内部错误' });
  }
});

dataRoutes.put('/:syncCode', async (req: Request, res: Response) => {
  try {
    const { syncCode } = req.params;
    if (!syncCode) {
      res.status(400).json({ error: '同步码不能为空' });
      return;
    }
    const { items, records, initialBalance } = req.body;
    const updated = await updateUserData(syncCode, { items, records, initialBalance });
    if (!updated) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (e) {
    console.error('[data/put] Error:', String(e));
    res.status(500).json({ error: '服务器内部错误' });
  }
});
