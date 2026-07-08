import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { generateId, getTodayStr } from '@/data/tracker';
import type { IItem } from '@/data/tracker';

interface AddEditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: IItem | null;
  onSave: (item: IItem) => void;
}

export default function AddEditTaskDialog({
  open,
  onOpenChange,
  editItem,
  onSave,
}: AddEditTaskDialogProps) {
  const isEdit = !!editItem;
  const today = getTodayStr();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [incompleteAmount, setIncompleteAmount] = useState('');
  const [repeatType, setRepeatType] = useState<'daily' | 'once'>('daily');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setAmount(String(editItem.amount));
      setIncompleteAmount(editItem.incompleteAmount != null ? String(editItem.incompleteAmount) : '');
      setRepeatType(editItem.repeatType);
      setStartDate(parseISO(editItem.startDate));
      setEndDate(editItem.endDate ? parseISO(editItem.endDate) : undefined);
    } else {
      setName('');
      setAmount('');
      setIncompleteAmount('');
      setRepeatType('daily');
      setStartDate(new Date());
      setEndDate(undefined);
    }
  }, [editItem, open]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('请输入事项名称');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('请输入有效的金额（大于0）');
      return;
    }
    const incompleteNum = incompleteAmount.trim() ? parseFloat(incompleteAmount) : undefined;
    if (incompleteNum !== undefined && (isNaN(incompleteNum) || incompleteNum <= 0)) {
      toast.error('未完成金额必须大于0');
      return;
    }
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
    if (endStr && endStr < startStr) {
      toast.error('结束日期不能早于开始日期');
      return;
    }

    const item: IItem = {
      id: editItem?.id || generateId(),
      name: name.trim(),
      amount: amountNum,
      incompleteAmount: incompleteNum,
      repeatType,
      startDate: startStr,
      endDate: repeatType === 'once' ? (endStr || startStr) : endStr,
      targetDate: undefined,
      createdAt: editItem?.createdAt || new Date().toISOString(),
    };

    onSave(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑事项' : '添加事项'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">事项名称</Label>
            <Input
              id="task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：早起打卡"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-amount">完成金额（完成时奖励）</Label>
            <Input
              id="task-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入完成奖励金额"
              min="0"
              step="1"
            />
            <p className="text-[11px] text-muted-foreground">
              完成获得 +{amount || '?'} 元
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-incomplete-amount">未完成金额（可选）</Label>
            <Input
              id="task-incomplete-amount"
              type="number"
              value={incompleteAmount}
              onChange={(e) => setIncompleteAmount(e.target.value)}
              placeholder="不填则标记未完成时不扣款"
              min="0"
              step="1"
            />
            <p className="text-[11px] text-muted-foreground">
              {incompleteAmount ? `未完成扣除 -${incompleteAmount} 元` : '未设置，默认扣除完成奖励金额'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>重复类型</Label>
            <div className="flex items-center gap-2">
              <Button
                variant={repeatType === 'daily' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setRepeatType('daily')}
                type="button"
              >
                每日重复
              </Button>
              <Button
                variant={repeatType === 'once' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setRepeatType('once')}
                type="button"
              >
                一次性
              </Button>
            </div>
          </div>

          {repeatType === 'once' ? (
            <>
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {format(startDate, 'yyyy年MM月dd日')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        if (d) {
                          setStartDate(d);
                          // 如果结束日期早于新的开始日期，自动调整
                          if (endDate && d > endDate) setEndDate(d);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>截止日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {endDate ? format(endDate, 'yyyy年MM月dd日') : format(startDate, 'yyyy年MM月dd日')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate || startDate}
                      onSelect={(d) => d && setEndDate(d)}
                      disabled={{ before: startDate }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-[11px] text-muted-foreground">
                  截止日期当天完成无惩罚，超期后每日递增扣款
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {format(startDate, 'yyyy年MM月dd日')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => d && setStartDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>结束日期（可选）</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {endDate ? format(endDate, 'yyyy年MM月dd日') : '不限'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mb-2"
                        onClick={() => setEndDate(undefined)}
                        type="button"
                      >
                        清除（不限结束日期）
                      </Button>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(d) => d && setEndDate(d)}
                        disabled={{ before: startDate }}
                        initialFocus
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? '保存修改' : '添加'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
