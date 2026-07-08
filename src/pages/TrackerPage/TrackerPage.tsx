import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import BalanceCardSection from './sections/BalanceCardSection';
import DateNavSection from './sections/DateNavSection';
import TaskListSection from './sections/TaskListSection';
import TrendChartSection from './sections/TrendChartSection';
import HistorySection from './sections/HistorySection';
import FloatingActionBar from './sections/FloatingActionBar';
import AddEditTaskDialog from './AddEditTaskDialog';
import AddExpenseDialog from './AddExpenseDialog';
import DeletedItemsDialog from './DeletedItemsDialog';
import TimeRewardDialog from './TimeRewardDialog';
import { getUserId, getTodayStr, computeDelayPenalties, generateId } from '@/data/tracker';
import type { IItem, IEntry, IExpense, ITimeReward, ITrackerData } from '@/data/tracker';
import { loadLocalData, saveLocalData, syncToCloud, syncFromCloud } from '@/services/api';

export default function TrackerPage() {
  const navigate = useNavigate();
  const userId = getUserId();

  const [data, setData] = useState<ITrackerData>({ items: [], records: {}, initialBalance: 0, expenses: [] });
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [timeRewardDialogOpen, setTimeRewardDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<IItem | null>(null);
  const [deletedDialogOpen, setDeletedDialogOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<{ date: string; entry: IEntry }[]>([]);
  const [loading, setLoading] = useState(true);

  const initialLoadDone = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    const init = async () => {
      let localData = loadLocalData(userId);
      const cloudData = await syncFromCloud(userId);
      if (cloudData && !cancelled) {
        localData = cloudData;
        saveLocalData(userId, cloudData);
      }
      if (!cancelled) {
        localData = computeDelayPenalties(localData, getTodayStr());
        setData(localData);
      }
    };

    init()
      .catch(() => {
        if (!cancelled) {
          const localData = loadLocalData(userId);
          setData(computeDelayPenalties(localData, getTodayStr()));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId || !initialLoadDone.current) return;
    saveLocalData(userId, data);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      syncToCloud(userId, data);
    }, 1000);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, userId]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    setData((prev) => computeDelayPenalties(prev, selectedDate));
  }, [selectedDate]);

  const handleCheckIn = useCallback((item: IItem, date: string, entry: IEntry) => {
    setData((prev) => {
      const records = { ...prev.records };
      const dateEntries = [...(records[date] || [])];
      dateEntries.push(entry);
      records[date] = dateEntries;
      return { ...prev, records };
    });
    setUndoStack((prev) => [...prev, { date, entry }]);
    const label = entry.completed ? '已完成' : '未完成';
    toast.success(`${label}：${item.name} ${entry.amountChange >= 0 ? '+' : ''}${entry.amountChange}`);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const last = newStack.pop()!;
      setData((prevData) => {
        const records = { ...prevData.records };
        const dateEntries = [...(records[last.date] || [])];
        const idx = dateEntries.findIndex(
          (e) => e.itemId === last.entry.itemId && e.timestamp === last.entry.timestamp
        );
        if (idx >= 0) {
          dateEntries.splice(idx, 1);
        }
        if (dateEntries.length === 0) {
          delete records[last.date];
        } else {
          records[last.date] = dateEntries;
        }
        return { ...prevData, records };
      });
      toast.info('已撤销上一次打卡');
      return newStack;
    });
  }, []);

  const handleUndoItem = useCallback((itemId: string) => {
    setData((prev) => {
      let latestDate = '';
      let latestIndex = -1;
      let latestTimestamp = '';
      for (const date of Object.keys(prev.records)) {
        const entries = prev.records[date];
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].itemId === itemId && entries[i].timestamp > latestTimestamp) {
            latestTimestamp = entries[i].timestamp;
            latestDate = date;
            latestIndex = i;
          }
        }
      }
      if (latestIndex < 0) return prev;
      const records = { ...prev.records };
      const dateEntries = [...records[latestDate]];
      dateEntries.splice(latestIndex, 1);
      if (dateEntries.length === 0) {
        delete records[latestDate];
      } else {
        records[latestDate] = dateEntries;
      }
      return { ...prev, records };
    });
    toast.success('已撤销最近一次操作');
  }, []);

  const handleResetItem = useCallback((itemId: string, date: string) => {
    setData((prev) => {
      const records = { ...prev.records };
      const dateEntries = (records[date] || []).filter((e) => e.itemId !== itemId);
      if (dateEntries.length === 0) {
        delete records[date];
      } else {
        records[date] = dateEntries;
      }
      return { ...prev, records };
    });
    toast.success('已重置打卡记录');
  }, []);

  const handleSaveItem = useCallback((item: IItem) => {
    setData((prev) => {
      const items = [...prev.items];
      const existingIdx = items.findIndex((i) => i.id === item.id);
      if (existingIdx >= 0) {
        items[existingIdx] = item;
      } else {
        items.push(item);
      }
      return { ...prev, items };
    });
    setEditItem(null);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    setData((prev) => {
      const items = prev.items.map((i) =>
        i.id === itemId ? { ...i, deleted: true } : i
      );
      return { ...prev, items };
    });
    toast.success('事项已删除（可恢复）');
  }, []);

  const handleRestoreItem = useCallback((itemId: string) => {
    setData((prev) => {
      const items = prev.items.map((i) =>
        i.id === itemId ? { ...i, deleted: false } : i
      );
      return { ...prev, items };
    });
    toast.success('事项已恢复');
  }, []);

  const handlePermanentDelete = useCallback((itemId: string) => {
    setData((prev) => {
      const items = prev.items.filter((i) => i.id !== itemId);
      const records = { ...prev.records };
      for (const date of Object.keys(records)) {
        records[date] = records[date].filter((e) => e.itemId !== itemId);
        if (records[date].length === 0) {
          delete records[date];
        }
      }
      return { ...prev, items, records };
    });
    toast.success('事项已永久删除');
  }, []);

  const handleInitialBalanceChange = useCallback((balance: number) => {
    setData((prev) => ({ ...prev, initialBalance: balance }));
  }, []);

  const handleTimeReward = useCallback((amount: number, type: 'add' | 'subtract') => {
    const reward: ITimeReward = {
      id: generateId(),
      type,
      amount,
      date: getTodayStr(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      timeRewards: [...(prev.timeRewards || []), reward],
    }));
  }, []);

  const handleDeleteTimeReward = useCallback((rewardId: string) => {
    setData((prev) => ({
      ...prev,
      timeRewards: (prev.timeRewards || []).filter((r) => r.id !== rewardId),
    }));
    toast.success('时间奖励记录已删除，余额已恢复');
  }, []);

  const handleImportData = useCallback((imported: ITrackerData) => {
    setData(imported);
  }, []);

  const handleEditItem = useCallback((item: IItem) => {
    setEditItem(item);
    setAddDialogOpen(true);
  }, []);

  const handleAddExpense = useCallback((expense: IExpense) => {
    setData((prev) => ({
      ...prev,
      expenses: [...(prev.expenses || []), expense],
    }));
  }, []);

  const handleDeleteExpense = useCallback((expenseId: string) => {
    setData((prev) => ({
      ...prev,
      expenses: (prev.expenses || []).filter((e) => e.id !== expenseId),
    }));
    toast.success('消费记录已删除');
  }, []);

  const handleDeleteEntry = useCallback((date: string, entryIndex: number) => {
    setData((prev) => {
      const records = { ...prev.records };
      const dateEntries = [...(records[date] || [])];
      if (entryIndex < 0 || entryIndex >= dateEntries.length) return prev;
      dateEntries.splice(entryIndex, 1);
      if (dateEntries.length === 0) {
        delete records[date];
      } else {
        records[date] = dateEntries;
      }
      return { ...prev, records };
    });
    toast.success('打卡记录已删除，余额已恢复');
  }, []);

  const handleAddItem = useCallback(() => {
    setEditItem(null);
    setAddDialogOpen(true);
  }, []);

  const deletedItems = useMemo(
    () => data.items.filter((i) => i.deleted),
    [data.items]
  );

  if (!userId) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="space-y-4 pb-24">
        
        {/* 👇 就是这里！我加了一个 sticky 容器包裹住余额框，彻底解决遮挡问题 👇 */}
        <div className="sticky top-0 z-40 bg-background pt-2 pb-2 -mt-2">
          <BalanceCardSection
            data={data}
            selectedDate={selectedDate}
            onInitialBalanceChange={handleInitialBalanceChange}
            onOpenTimeReward={() => setTimeRewardDialogOpen(true)}
          />
        </div>
        {/* 👆 sticky 容器结束 👆 */}

        <DateNavSection
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        <TaskListSection
          data={data}
          selectedDate={selectedDate}
          onCheckIn={handleCheckIn}
          onUndoItem={handleUndoItem}
          onResetItem={handleResetItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
        <TrendChartSection data={data} selectedDate={selectedDate} />
        <HistorySection
          data={data}
          onDeleteExpense={handleDeleteExpense}
          onDeleteEntry={handleDeleteEntry}
          onDeleteTimeReward={handleDeleteTimeReward}
        />
      </main>

      <FloatingActionBar
        data={data}
        userId={userId || ''}
        onAddItem={handleAddItem}
        onAddExpense={() => setExpenseDialogOpen(true)}
        onManageDeleted={() => setDeletedDialogOpen(true)}
        onImportData={handleImportData}
      />

      <AddEditTaskDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditItem(null);
        }}
        editItem={editItem}
        onSave={handleSaveItem}
      />

      <AddExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onSave={handleAddExpense}
      />

      <DeletedItemsDialog
        open={deletedDialogOpen}
        onOpenChange={setDeletedDialogOpen}
        deletedItems={deletedItems}
        onRestore={handleRestoreItem}
        onPermanentDelete={handlePermanentDelete}
      />

      <TimeRewardDialog
        open={timeRewardDialogOpen}
        onOpenChange={setTimeRewardDialogOpen}
        onConfirm={handleTimeReward}
      />
    </div>
  );
}