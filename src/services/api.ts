import type { ITrackerData } from '@/data/tracker';

// ==========================================
// 🔑 你的云端数据库钥匙
// ==========================================
const SUPABASE_URL = 'https://ooqiffxlshfegctgfaqu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZgQbofvB5Qg8fS-nM0hkkA_oXN_1RoC';

// ==========================================
// 本地缓存（离线时自动降级保存在这里）
// ==========================================
const CACHE_KEY_PREFIX = '__tracker_data_';

function getCacheKey(syncCode: string): string {
  return `${CACHE_KEY_PREFIX}${syncCode}`;
}

export function loadLocalData(syncCode: string): ITrackerData {
  try {
    const raw = localStorage.getItem(getCacheKey(syncCode));
    if (!raw) return { items: [], records: {}, initialBalance: 0, expenses: [], timeRewards: [] };
    const parsed = JSON.parse(raw);
    return {
      items: parsed.items || [],
      records: parsed.records || {},
      initialBalance: parsed.initialBalance ?? 0,
      expenses: parsed.expenses || [],
      timeRewards: parsed.timeRewards || [],
    };
  } catch {
    return { items: [], records: {}, initialBalance: 0, expenses: [], timeRewards: [] };
  }
}

export function saveLocalData(syncCode: string, data: ITrackerData): void {
  try {
    const cacheData = {
      ...data,
      _cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(getCacheKey(syncCode), JSON.stringify(cacheData));
  } catch (e) {
    console.error('保存本地数据失败:', String(e));
  }
}

// ==========================================
// 全新云端数据库（Supabase）
// ==========================================

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation'
};

export async function loadFromCloud(syncCode: string): Promise<ITrackerData | null> {
  // 如果还没填密钥，就直接返回空，继续用本地数据
  if (!SUPABASE_URL || SUPABASE_URL.includes('请在这里粘贴')) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tracker_data?sync_code=eq.${syncCode}&select=*`, {
      method: 'GET',
      headers
    });

    if (!response.ok) throw new Error('网络请求失败');
    const rows = await response.json();

    if (rows && rows.length > 0) {
      // Supabase 直接支持存 JSON
      return rows[0].data as ITrackerData;
    }
    return null;
  } catch (e) {
    console.error('从云端加载数据失败:', String(e));
    return null;
  }
}

export async function saveToCloud(syncCode: string, data: ITrackerData): Promise<boolean> {
  if (!SUPABASE_URL || SUPABASE_URL.includes('请在这里粘贴')) return false;

  try {
    // 触发 Upsert：如果该账号(syncCode)存在则覆盖更新，不存在则创建
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tracker_data`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        sync_code: syncCode,
        data: data
      })
    });

    if (!response.ok) {
      console.error('保存到云端失败', await response.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('保存数据到云端失败:', String(e));
    return false;
  }
}

// ==========================================
// 兼容旧接口（完全不用改别的页面代码）
// ==========================================

export async function syncToCloud(syncCode: string, data: ITrackerData): Promise<void> {
  saveLocalData(syncCode, data);
  saveToCloud(syncCode, data).catch(() => {});
}

export async function syncFromCloud(syncCode: string): Promise<ITrackerData | null> {
  const cloudData = await loadFromCloud(syncCode);
  if (cloudData) {
    saveLocalData(syncCode, cloudData);
  }
  return cloudData;
}