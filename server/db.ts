import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
dotenv.config();

// 连接到 Upstash 云端数据库（我们等会儿去免费申请这两个 Key）
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export interface IStoredData {
  syncCode: string;
  items: IStoredItem[];
  records: Record<string, IStoredEntry[]>;
  initialBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface IStoredItem {
  id: string;
  name: string;
  amount: number;
  isReward: boolean;
  repeatType: 'daily' | 'once';
  targetDate?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  deleted?: boolean;
}

export interface IStoredEntry {
  itemId: string;
  itemName: string;
  completed: boolean;
  amountChange: number;
  timestamp: string;
}

// 检查用户是否存在（异步）
export async function userExists(syncCode: string): Promise<boolean> {
  const exists = await redis.exists(`user:${syncCode}`);
  return exists === 1;
}

// 获取用户数据（异步）
export async function getUserData(syncCode: string): Promise<IStoredData | null> {
  const data = await redis.get<IStoredData>(`user:${syncCode}`);
  return data || null;
}

// 创建新用户（异步）
export async function createUser(syncCode: string, initialData?: {
  items?: IStoredItem[];
  records?: Record<string, IStoredEntry[]>;
  initialBalance?: number;
}): Promise<IStoredData> {
  const now = new Date().toISOString();
  const data: IStoredData = {
    syncCode,
    items: initialData?.items || [],
    records: initialData?.records || {},
    initialBalance: initialData?.initialBalance ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  await redis.set(`user:${syncCode}`, data);
  return data;
}

// 更新用户数据（异步）
export async function updateUserData(
  syncCode: string,
  updates: {
    items?: IStoredItem[];
    records?: Record<string, IStoredEntry[]>;
    initialBalance?: number;
  }
): Promise<IStoredData | null> {
  const existing = await getUserData(syncCode);
  if (!existing) return null;
  const updated: IStoredData = {
    ...existing,
    items: updates.items ?? existing.items,
    records: updates.records ?? existing.records,
    initialBalance: updates.initialBalance ?? existing.initialBalance,
    updatedAt: new Date().toISOString(),
  };
  await redis.set(`user:${syncCode}`, updated);
  return updated;
}