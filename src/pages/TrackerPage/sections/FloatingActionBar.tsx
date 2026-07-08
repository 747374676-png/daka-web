import { useState, useRef } from 'react';
import { Plus, Menu, Download, Upload, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { ITrackerData } from '@/data/tracker';

interface FloatingActionBarProps {
  data: ITrackerData;
  userId: string;
  onAddItem: () => void;
  onAddExpense: () => void;
  onManageDeleted: () => void;
  onImportData: (data: ITrackerData) => void;
}

export default function FloatingActionBar({
  data,
  userId,
  onAddItem,
  onAddExpense,
  onManageDeleted,
  onImportData,
}: FloatingActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = {
      userId,
      items: data.items,
      records: data.records,
      expenses: data.expenses || [],
      initialBalance: data.initialBalance,
      timeRewards: data.timeRewards || [],
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    a.href = url;
    a.download = `reward-tracker-backup-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('数据已导出');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const parsed = JSON.parse(raw);
        if (
          !parsed.items ||
          !parsed.records ||
          parsed.initialBalance === undefined
        ) {
          toast.error('文件格式不正确，缺少必要字段');
          return;
        }
        onImportData({
          items: parsed.items,
          records: parsed.records,
          expenses: parsed.expenses || [],
          initialBalance: parsed.initialBalance,
          timeRewards: parsed.timeRewards || [],
        });
        toast.success('数据导入成功');
      } catch {
        toast.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="h-12 w-12 rounded-2xl shadow-lg border border-border/50"
            >
              <Menu className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem onClick={onAddExpense} className="gap-2">
              <ShoppingBag className="size-4" />
              记一笔消费
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport} className="gap-2">
              <Download className="size-4" />
              导出数据
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportClick} className="gap-2">
              <Upload className="size-4" />
              导入数据
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageDeleted} className="gap-2">
              <Trash2 className="size-4" />
              管理已删除事项
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="icon"
          className="h-14 w-14 rounded-2xl shadow-lg"
          onClick={onAddItem}
        >
          <Plus className="size-6" />
        </Button>
      </div>
    </>
  );
}
