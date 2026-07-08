// EXPORTS: IItem, IEntry, IExpense, ITimeReward, IRecordMap, ITrackerData, getUserId, setUserId, clearUserId, getDefaultItems, calculateBalance, calculateTodayStats, calculateCumulativeStats, calculateTrendData, getDateLabel, getTodayStr, getWeekDayLabel, getSortedHistoryDates, getSortedExpenseDates, generateId, isItemActiveOnDate, getDelayDays, getDelayMultiplier, hasDelayRecordForDate, hasCompletionRecord, getCompletionDate, computeDelayPenalties, getOnceDateRange, getSortedTimeRewardDates

import { scopedStorage } from '@lark-apaas/client-toolkit-lite';
import { format, parseISO, isAfter, isBefore, startOfDay, addDays, subDays } from 'date-fns';

export interface IItem {
  id: string;
  name: string;
  amount: number;
  /** 未完成时扣除的金额（可选，不填则标记未完成时不扣款） */
  incompleteAmount?: number;
  repeatType: 'daily' | 'once';
  targetDate?: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  deleted?: boolean;
}

export interface IEntry {
  itemId: string;
  itemName: string;
  completed: boolean;
  amountChange: number;
  timestamp: string;
  /** 仅延期惩罚记录有此字段，表示这是第几天的延期惩罚 */
  delayDays?: number;
}

export interface IExpense {
  id: string;
  reason: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface ITimeReward {
  id: string;
  type: 'add' | 'subtract';
  amount: number;
  date: string;
  createdAt: string;
}

export interface IRecordMap {
  [date: string]: IEntry[];
}

export interface ITrackerData {
  items: IItem[];
  records: IRecordMap;
  initialBalance: number;
  expenses: IExpense[];
  timeRewards?: ITimeReward[];
}

const USER_ID_KEY = '__tracker_user_id';

export function getUserId(): string | null {
  return scopedStorage.getItem(USER_ID_KEY);
}

export function setUserId(userId: string): void {
  scopedStorage.setItem(USER_ID_KEY, userId);
}

export function clearUserId(): void {
  scopedStorage.removeItem(USER_ID_KEY);
}

export function getDefaultItems(): IItem[] {
  const today = getTodayStr();
  return [
    {
      id: '1',
      name: '早起打卡',
      amount: 10,
      repeatType: 'daily',
      startDate: today,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: '阅读30分钟',
      amount: 5,
      repeatType: 'daily',
      startDate: today,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: '不吃零食',
      amount: 8,
      repeatType: 'daily',
      startDate: today,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getWeekDayLabel(dateStr: string): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const d = parseISO(dateStr);
  return `周${days[d.getDay()]}`;
}

export function getDateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  const today = getTodayStr();
  const isToday = dateStr === today;
  const prefix = isToday ? '今天' : '';
  return `${prefix}${format(d, 'yyyy年MM月dd日')} ${getWeekDayLabel(dateStr)}`;
}

export function isItemActiveOnDate(item: IItem, dateStr: string, records?: IRecordMap): boolean {
  if (item.deleted) return false;
  const date = parseISO(dateStr);
  const start = parseISO(item.startDate);
  if (isBefore(date, startOfDay(start))) return false;
  // 一次性事项：开始日期之后可见，但如果已完成则在完成日期后隐藏
  if (item.repeatType === 'once') {
    if (records && hasCompletionRecord(records, item.id)) {
      const completionDate = getCompletionDate(records, item.id);
      if (completionDate && isAfter(startOfDay(date), startOfDay(parseISO(completionDate)))) {
        return false;
      }
    }
    return true;
  }
  // 每日重复事项：endDate 是截止显示日期
  if (item.endDate) {
    const end = parseISO(item.endDate);
    if (isAfter(startOfDay(date), startOfDay(end))) return false;
  }
  return true;
}

export function calculateBalance(data: ITrackerData): number {
  let balance = data.initialBalance;
  const allDates = Object.keys(data.records);
  for (const date of allDates) {
    const entries = data.records[date];
    for (const entry of entries) {
      balance += entry.amountChange;
    }
  }
  // 扣除所有消费
  for (const expense of data.expenses || []) {
    balance -= expense.amount;
  }
  // 时间奖励调整
  for (const reward of data.timeRewards || []) {
    balance += reward.type === 'add' ? reward.amount : -reward.amount;
  }
  return balance;
}

export function calculateTodayStats(data: ITrackerData, dateStr: string) {
  const entries = data.records[dateStr] || [];
  let rewardTotal = 0;
  let punishTotal = 0;
  for (const entry of entries) {
    if (entry.amountChange > 0) {
      rewardTotal += entry.amountChange;
    } else {
      punishTotal += Math.abs(entry.amountChange);
    }
  }
  // 当日消费
  const todayExpenses = (data.expenses || []).filter((e) => e.date === dateStr);
  const expenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  // 当日时间奖励
  const todayRewards = (data.timeRewards || []).filter((r) => r.date === dateStr);
  const rewardAdd = todayRewards.filter((r) => r.type === 'add').reduce((s, r) => s + r.amount, 0);
  const rewardSub = todayRewards.filter((r) => r.type === 'subtract').reduce((s, r) => s + r.amount, 0);
  return {
    rewardTotal: rewardTotal + rewardAdd,
    punishTotal: punishTotal + rewardSub,
    expenseTotal,
    netTotal: rewardTotal + rewardAdd - punishTotal - rewardSub - expenseTotal,
  };
}

export function calculateCumulativeStats(data: ITrackerData) {
  let totalReward = 0;
  let totalPunish = 0;
  const allDates = Object.keys(data.records);
  for (const date of allDates) {
    const entries = data.records[date];
    for (const entry of entries) {
      if (entry.amountChange > 0) {
        totalReward += entry.amountChange;
      } else {
        totalPunish += Math.abs(entry.amountChange);
      }
    }
  }
  // 时间奖励统计
  for (const reward of data.timeRewards || []) {
    if (reward.type === 'add') {
      totalReward += reward.amount;
    } else {
      totalPunish += reward.amount;
    }
  }
  const totalExpense = (data.expenses || []).reduce((sum, e) => sum + e.amount, 0);
  return {
    totalReward,
    totalPunish,
    totalExpense,
    netTotal: totalReward - totalPunish - totalExpense,
  };
}

export function calculateTrendData(data: ITrackerData, endDateStr: string, days: number) {
  const result: { date: string; balance: number }[] = [];
  let runningBalance = data.initialBalance;

  const startDate = subDays(parseISO(endDateStr), days - 1);

  for (let i = 0; i < days; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const entries = data.records[dateStr] || [];
    for (const entry of entries) {
      runningBalance += entry.amountChange;
    }
    // 扣除当日消费
    const dayExpenses = (data.expenses || []).filter((e) => e.date === dateStr);
    for (const expense of dayExpenses) {
      runningBalance -= expense.amount;
    }
    // 当日时间奖励
    const dayRewards = (data.timeRewards || []).filter((r) => r.date === dateStr);
    for (const reward of dayRewards) {
      runningBalance += reward.type === 'add' ? reward.amount : -reward.amount;
    }
    if (dateStr <= endDateStr) {
      result.push({ date: dateStr, balance: runningBalance });
    }
  }

  return result;
}

export function getSortedHistoryDates(records: IRecordMap): string[] {
  return Object.keys(records)
    .filter((date) => records[date] && records[date].length > 0)
    .sort((a, b) => b.localeCompare(a));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getSortedExpenseDates(expenses: IExpense[]): string[] {
  const dateSet = new Set(expenses.map((e) => e.date));
  return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
}

export function getSortedTimeRewardDates(rewards: ITimeReward[]): string[] {
  const dateSet = new Set(rewards.map((r) => r.date));
  return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
}

// ========== 延期惩罚机制 ==========

/** 获取一次性事项的截止日期（延期惩罚从该日期次日开始） */
function getDeadline(item: IItem): string | null {
  if (item.repeatType !== 'once') return null;
  // 优先使用 endDate，兼容旧数据的 targetDate
  return item.endDate || item.targetDate || null;
}

/** 计算一次性事项在指定日期的延期天数（截止日期之后的天数，第1天=截止次日） */
export function getDelayDays(item: IItem, dateStr: string): number {
  const deadline = getDeadline(item);
  if (!deadline) return 0;
  const dl = parseISO(deadline);
  const current = parseISO(dateStr);
  if (!isAfter(startOfDay(current), startOfDay(dl))) return 0;
  return Math.floor(
    (startOfDay(current).getTime() - startOfDay(dl).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

/** 计算延期第N天对应的惩罚倍数（第1天=1倍，第2天=2倍...） */
export function getDelayMultiplier(delayDays: number): number {
  return delayDays;
}

/** 获取一次性事项的日期范围显示文本 */
export function getOnceDateRange(item: IItem): string {
  if (item.repeatType !== 'once') return '';
  const start = item.startDate;
  const end = item.endDate || item.targetDate || item.startDate;
  const fmt = (s: string) => {
    const d = parseISO(s);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };
  if (start === end) return fmt(start);
  return `${fmt(start)} - ${fmt(end)}`;
}

/** 检查指定日期是否已有该事项的延期惩罚记录 */
export function hasDelayRecordForDate(
  records: IRecordMap,
  dateStr: string,
  itemId: string
): boolean {
  const entries = records[dateStr] || [];
  return entries.some((e) => e.itemId === itemId && e.delayDays !== undefined);
}

/** 检查事项是否已被用户手动完成（存在非延期惩罚的记录） */
export function hasCompletionRecord(records: IRecordMap, itemId: string): boolean {
  for (const date of Object.keys(records)) {
    const entries = records[date];
    if (entries.some((e) => e.itemId === itemId && e.delayDays === undefined)) {
      return true;
    }
  }
  return false;
}

/** 获取一次性事项的完成日期（用户手动完成的那天） */
export function getCompletionDate(records: IRecordMap, itemId: string): string | null {
  const dates = Object.keys(records).sort();
  for (const date of dates) {
    const entries = records[date];
    if (entries.some((e) => e.itemId === itemId && e.delayDays === undefined && e.completed)) {
      return date;
    }
  }
  return null;
}

/**
 * 自动计算并补全所有过期未完成一次性事项的延期惩罚记录。
 * 对每个未完成的 once 事项，从 targetDate+1 到 upToDate（不超过今天），
 * 逐日检查是否已有延期记录，没有则自动生成一条。
 */
export function computeDelayPenalties(
  data: ITrackerData,
  upToDate: string
): ITrackerData {
  const today = getTodayStr();
  const limitDate = upToDate > today ? today : upToDate;
  const newRecords = { ...data.records };
  let changed = false;

  for (const item of data.items) {
    if (item.deleted || item.repeatType !== 'once') continue;
    const deadline = getDeadline(item);
    if (!deadline) continue;
    if (hasCompletionRecord(newRecords, item.id)) continue;

    const dl = parseISO(deadline);
    let cursor = addDays(dl, 1);
    const limit = parseISO(limitDate);

    while (
      isBefore(startOfDay(cursor), startOfDay(limit)) ||
      format(cursor, 'yyyy-MM-dd') === limitDate
    ) {
      const cursorStr = format(cursor, 'yyyy-MM-dd');
      if (cursorStr > today) break;

      if (!hasDelayRecordForDate(newRecords, cursorStr, item.id)) {
        const delayDays = getDelayDays(item, cursorStr);
        const multiplier = getDelayMultiplier(delayDays);
        const entry: IEntry = {
          itemId: item.id,
          itemName: item.name,
          completed: false,
          amountChange: -(item.amount * multiplier),
          timestamp: new Date().toISOString(),
          delayDays,
        };
        newRecords[cursorStr] = [...(newRecords[cursorStr] || []), entry];
        changed = true;
      }

      cursor = addDays(cursor, 1);
    }
  }

  return changed ? { ...data, records: newRecords } : data;
}
