import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ShoppingBag } from 'lucide-react';
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
import type { IExpense } from '@/data/tracker';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (expense: IExpense) => void;
}

export default function AddExpenseDialog({
  open,
  onOpenChange,
  onSave,
}: AddExpenseDialogProps) {
  const today = getTodayStr();

  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (open) {
      setReason('');
      setAmount('');
      setDate(new Date());
    }
  }, [open]);

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('请输入消费原因');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('请输入有效的金额（大于0）');
      return;
    }

    const expense: IExpense = {
      id: generateId(),
      reason: reason.trim(),
      amount: amountNum,
      date: format(date, 'yyyy-MM-dd'),
      createdAt: new Date().toISOString(),
    };

    onSave(expense);
    onOpenChange(false);
    toast.success(`已记录消费：${reason.trim()} -${amountNum}元`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            记一笔消费
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="expense-reason">消费原因</Label>
            <Input
              id="expense-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例如：买奶茶、打车、吃饭"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">消费金额</Label>
            <Input
              id="expense-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入金额"
              min="0"
              step="1"
            />
            <p className="text-[11px] text-muted-foreground">
              将从余额中扣除 {amount ? `-${amount}` : '?'} 元
            </p>
          </div>

          <div className="space-y-2">
            <Label>消费日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {format(date, 'yyyy年MM月dd日')}
                  {format(date, 'yyyy-MM-dd') === today && (
                    <span className="ml-1 text-xs text-muted-foreground">（今天）</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>确认扣款</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
