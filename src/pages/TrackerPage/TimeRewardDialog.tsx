import { useState, useEffect } from 'react';
import { Clock, Plus, Minus } from 'lucide-react';
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
import { toast } from 'sonner';

interface TimeRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number, type: 'add' | 'subtract') => void;
}

export default function TimeRewardDialog({
  open,
  onOpenChange,
  onConfirm,
}: TimeRewardDialogProps) {
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) {
      setType('add');
      setAmount('');
    }
  }, [open]);

  const handleConfirm = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error('请输入有效的金额（大于0）');
      return;
    }
    onConfirm(num, type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            时间奖励
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>操作类型</Label>
            <div className="flex items-center gap-2">
              <Button
                variant={type === 'add' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-1"
                onClick={() => setType('add')}
                type="button"
              >
                <Plus className="size-4" />
                增加余额
              </Button>
              <Button
                variant={type === 'subtract' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-1"
                onClick={() => setType('subtract')}
                type="button"
              >
                <Minus className="size-4" />
                减少余额
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-reward-amount">调整金额</Label>
            <Input
              id="time-reward-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入金额"
              min="0"
              step="1"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              {type === 'add' ? `将增加余额 +¥${amount || '?'}` : `将减少余额 -¥${amount || '?'}`}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认调整</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
