import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, TrendingUp, TrendingDown, Minus, ShoppingBag, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { calculateBalance, calculateTodayStats } from '@/data/tracker';
import type { ITrackerData } from '@/data/tracker';

interface BalanceCardSectionProps {
  data: ITrackerData;
  selectedDate: string;
  onInitialBalanceChange: (balance: number) => void;
  onOpenTimeReward: () => void;
}

export default function BalanceCardSection({
  data,
  selectedDate,
  onInitialBalanceChange,
  onOpenTimeReward,
}: BalanceCardSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState(String(data.initialBalance));
  const prevBalance = useRef(calculateBalance(data));

  const currentBalance = calculateBalance(data);
  const todayStats = calculateTodayStats(data, selectedDate);

  useEffect(() => {
    prevBalance.current = currentBalance;
  }, [currentBalance]);

  const handleSaveBalance = () => {
    const val = parseFloat(balanceInput);
    if (isNaN(val)) {
      toast.error('请输入有效的数字');
      return;
    }
    onInitialBalanceChange(val);
    setDialogOpen(false);
    toast.success('初始余额已更新');
  };

  return (
    <>
      {/* 👇 这里的 style 悬浮代码被删掉了！上下间距稍微调小了一点 👇 */}
      <section className="w-full pb-4 pt-2">
        <div className="max-w-5xl mx-auto px-4">
          <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-primary/5 via-card to-amber-50/30">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 0%, hsl(35 65% 52% / 0.08), transparent 70%)',
              }}
            />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-muted-foreground font-medium">
                  当前余额
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setBalanceInput(String(data.initialBalance));
                    setDialogOpen(true);
                  }}
                >
                  <Settings className="size-4" />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={currentBalance}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl font-bold tracking-tight tabular-nums text-foreground"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {currentBalance >= 0 ? '+' : ''}
                  {currentBalance}
                </motion.p>
              </AnimatePresence>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <div className="size-7 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="size-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">今日奖励</div>
                    <div className="text-sm font-semibold text-emerald-600 tabular-nums">
                      +{todayStats.rewardTotal}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-7 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown className="size-3.5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">今日惩罚</div>
                    <div className="text-sm font-semibold text-red-500 tabular-nums">
                      -{todayStats.punishTotal}
                    </div>
                  </div>
                </div>
                {todayStats.expenseTotal > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="size-7 rounded-full bg-amber-100 flex items-center justify-center">
                      <ShoppingBag className="size-3.5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">今日消费</div>
                      <div className="text-sm font-semibold text-amber-600 tabular-nums">
                        -{todayStats.expenseTotal}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="size-7 rounded-full bg-accent flex items-center justify-center">
                    <Minus className="size-3.5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">今日净值</div>
                    <div
                      className={`text-sm font-semibold tabular-nums ${
                        todayStats.netTotal >= 0
                          ? 'text-emerald-600'
                          : 'text-red-500'
                      }`}
                    >
                      {todayStats.netTotal >= 0 ? '+' : ''}
                      {todayStats.netTotal}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间奖励按钮 */}
          <div className="flex justify-center mt-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={onOpenTimeReward}
            >
              <Clock className="size-3.5" />
              时间奖励
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>设置初始余额</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="init-balance">初始余额</Label>
              <Input
                id="init-balance"
                type="number"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="输入初始余额"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveBalance}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}