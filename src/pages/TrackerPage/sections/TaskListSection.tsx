import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Edit, Trash2, Undo2, RotateCcw, CheckCircle2, Filter, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { isItemActiveOnDate, getDelayDays, getDelayMultiplier, hasCompletionRecord, getOnceDateRange } from '@/data/tracker';
import type { IItem, IEntry, ITrackerData } from '@/data/tracker';

interface TaskListSectionProps {
  data: ITrackerData;
  selectedDate: string;
  onCheckIn: (item: IItem, date: string, entry: IEntry) => void;
  onUndoItem: (itemId: string) => void;
  onResetItem: (itemId: string, date: string) => void;
  onEditItem: (item: IItem) => void;
  onDeleteItem: (itemId: string) => void;
}

/** 计算事项全量统计 */
function computeItemStats(records: ITrackerData['records'], itemId: string) {
  let completeCount = 0;
  let incompleteCount = 0;
  let totalEarned = 0;
  let totalDeducted = 0;

  for (const date of Object.keys(records)) {
    for (const entry of records[date]) {
      if (entry.itemId !== itemId) continue;
      if (entry.completed) {
        completeCount++;
        totalEarned += entry.amountChange;
      } else {
        incompleteCount++;
        totalDeducted += Math.abs(entry.amountChange);
      }
    }
  }

  return { completeCount, incompleteCount, totalEarned, totalDeducted };
}

export default function TaskListSection({
  data,
  selectedDate,
  onCheckIn,
  onUndoItem,
  onResetItem,
  onEditItem,
  onDeleteItem,
}: TaskListSectionProps) {
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const activeItems = data.items.filter((item) => isItemActiveOnDate(item, selectedDate, data.records));
  const todayEntries = data.records[selectedDate] || [];

  const allStats = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeItemStats>> = {};
    for (const item of data.items) {
      map[item.id] = computeItemStats(data.records, item.id);
    }
    return map;
  }, [data.records, data.items]);

  const isItemManuallyMarked = (itemId: string) => {
    return todayEntries.some((e) => e.itemId === itemId && e.delayDays === undefined);
  };

  const getItemTodayStatus = (itemId: string): 'none' | 'completed' | 'incomplete' => {
    const manualEntries = todayEntries.filter((e) => e.itemId === itemId && e.delayDays === undefined);
    if (manualEntries.length === 0) return 'none';
    const last = manualEntries[manualEntries.length - 1];
    return last.completed ? 'completed' : 'incomplete';
  };

  const filteredItems = useMemo(() => {
    const base = filterEnabled
      ? activeItems.filter((item) => !isItemManuallyMarked(item.id))
      : [...activeItems];
    base.sort((a, b) => {
      if (sortBy === 'createdAt') {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? tb - ta : ta - tb;
      }
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });
    return base;
  }, [activeItems, filterEnabled, todayEntries, sortBy, sortOrder]);

  const handleComplete = (item: IItem) => {
    if (isItemManuallyMarked(item.id)) return;
    const entry: IEntry = {
      itemId: item.id,
      itemName: item.name,
      completed: true,
      amountChange: item.amount,
      timestamp: new Date().toISOString(),
    };
    onCheckIn(item, selectedDate, entry);
  };

  const handleIncomplete = (item: IItem) => {
    if (isItemManuallyMarked(item.id)) return;
    const deductAmount = item.incompleteAmount != null && item.incompleteAmount > 0
      ? item.incompleteAmount
      : item.amount;
    const entry: IEntry = {
      itemId: item.id,
      itemName: item.name,
      completed: false,
      amountChange: -deductAmount,
      timestamp: new Date().toISOString(),
    };
    onCheckIn(item, selectedDate, entry);
  };

  const handleReset = (itemId: string) => {
    onResetItem(itemId, selectedDate);
    setResetTarget(null);
  };

  return (
    <>
      <section className="w-full">
        <div className="max-w-5xl mx-auto px-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">今日任务</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="size-3.5 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'amount')}
                      className="h-7 text-[11px] rounded-lg border border-border/60 bg-background px-2 py-0 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="createdAt">创建时间</option>
                      <option value="amount">金额大小</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                      className="h-7 px-2 text-[11px] rounded-lg border border-border/60 bg-background text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      title={sortOrder === 'desc' ? '倒序' : '正序'}
                    >
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {filterEnabled ? '仅待处理' : '全部'}
                  </span>
                  <button
                    onClick={() => setFilterEnabled(!filterEnabled)}
                    className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                      filterEnabled ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`}
                  >
                    <span
                      className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        filterEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                    <Filter className={`size-3.5 ${filterEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 text-center"
                  >
                    <div className="size-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
                      <CheckCircle2 className="size-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {filterEnabled ? '暂无待处理事项' : '暂无任务，点击下方按钮添加'}
                    </p>
                  </motion.div>
                ) : (
                  filteredItems.map((item, i) => {
                    const stats = allStats[item.id] || { completeCount: 0, incompleteCount: 0, totalEarned: 0, totalDeducted: 0 };
                    const status = getItemTodayStatus(item.id);
                    const isGreen = status === 'completed';
                    const isRed = status === 'incomplete';

                    const delayDays = item.repeatType === 'once' ? getDelayDays(item, selectedDate) : 0;
                    const isDelayed = delayDays > 0;
                    const delayMultiplier = getDelayMultiplier(delayDays);
                    const baseDeduct = item.incompleteAmount != null && item.incompleteAmount > 0 ? item.incompleteAmount : item.amount;
                    const delayDeductAmount = baseDeduct * delayMultiplier;
                    const dateRangeLabel = item.repeatType === 'once' ? getOnceDateRange(item) : '';
                    const isOnceCompleted = item.repeatType === 'once' && hasCompletionRecord(data.records, item.id);
                    
                    const hasTodayEntries = todayEntries.some((e) => e.itemId === item.id && e.delayDays === undefined);

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-colors flex flex-col p-3 ${
                          isGreen ? 'border-emerald-300' : isRed ? 'border-red-300' : 'border-border'
                        }`}
                      >
                        {/* 顶部：标题、标签、编辑按钮 */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            {/* 完整展示标题，取消截断 */}
                            <span className="text-[14px] font-medium leading-tight break-words text-foreground">
                              {item.name}
                            </span>
                            
                            {/* 标签区 */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                                +¥{item.amount}
                              </span>
                              {item.incompleteAmount != null && item.incompleteAmount > 0 && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">
                                  -¥{item.incompleteAmount}
                                </span>
                              )}
                              {item.repeatType === 'daily' && (
                                <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  每日
                                </span>
                              )}
                              {item.repeatType === 'once' && (
                                <span className="shrink-0 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  {dateRangeLabel}
                                </span>
                              )}
                              {isDelayed && !isOnceCompleted && (
                                <span className="shrink-0 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-semibold animate-pulse">
                                  延期{delayDays}天 -¥{delayDeductAmount}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 右上角较小的操作图标 */}
                          <div className="flex items-center shrink-0 -mt-1 -mr-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEditItem(item)}>
                              <Edit className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDeleteItem(item.id)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* 底部：统计和打卡按钮 */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
                          {/* 左侧：历史统计和当前状态 */}
                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-0.5">
                              <span className="text-emerald-600 font-semibold">√</span>{stats.completeCount}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <span className="text-red-500 font-semibold">X</span>{stats.incompleteCount}
                            </span>
                            {isGreen ? (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">已完成</span>
                            ) : isRed ? (
                              <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium">未完成</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">待处理</span>
                            )}
                          </div>

                          {/* 右侧：操作按钮 (打卡后自动折叠为小按钮) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasTodayEntries ? (
                              <>
                                <button
                                  onClick={() => onUndoItem(item.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 px-2 py-1 rounded transition-colors"
                                >
                                  <Undo2 className="size-3" /> 撤销
                                </button>
                                <button
                                  onClick={() => setResetTarget(item.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 px-2 py-1 rounded transition-colors"
                                >
                                  <RotateCcw className="size-3" /> 重置
                                </button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[11px] gap-1 rounded-full px-3 border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                  onClick={() => handleComplete(item)}
                                >
                                  <Check className="size-3" /> 完成
                                </Button>

                                <div className="relative">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[11px] gap-1 rounded-full px-3 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleIncomplete(item)}
                                  >
                                    <X className="size-3" /> 未完成
                                  </Button>
                                  {stats.incompleteCount > 0 && (
                                    <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center leading-none">
                                      {stats.incompleteCount}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </section>

      <AlertDialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>重置打卡记录</AlertDialogTitle>
            <AlertDialogDescription>
              将清除该事项今日所有打卡记录，余额将相应恢复。确定要重置吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetTarget && handleReset(resetTarget)}>
              确定重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}