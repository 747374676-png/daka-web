import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, ShoppingBag, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSortedHistoryDates, getSortedExpenseDates, getSortedTimeRewardDates, getDateLabel } from '@/data/tracker';
import type { ITrackerData, IExpense } from '@/data/tracker';

interface HistorySectionProps {
  data: ITrackerData;
  onDeleteExpense: (expenseId: string) => void;
  onDeleteEntry: (date: string, entryIndex: number) => void;
  onDeleteTimeReward: (rewardId: string) => void;
}

export default function HistorySection({ data, onDeleteExpense, onDeleteEntry, onDeleteTimeReward }: HistorySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const dates = useMemo(() => getSortedHistoryDates(data.records), [data.records]);
  const expenses = data.expenses || [];
  const expenseDates = useMemo(() => getSortedExpenseDates(expenses), [expenses]);
  const timeRewards = data.timeRewards || [];
  const timeRewardDates = useMemo(() => getSortedTimeRewardDates(timeRewards), [timeRewards]);

  const hasRecords = dates.length > 0 || expenses.length > 0 || timeRewards.length > 0;

  return (
    <section className="w-full">
      <div className="max-w-5xl mx-auto px-4">
        <Card>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-xl"
          >
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">历史记录</CardTitle>
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChevronDown className="size-5 text-muted-foreground" />
                </motion.div>
              </div>
            </CardHeader>
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <CardContent className="pt-4 space-y-3">
                  {!hasRecords ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">暂无打卡记录</p>
                    </div>
                  ) : (
                    <>
                      {/* 打卡记录 */}
                      {dates.map((date, i) => {
                        const entries = data.records[date] || [];
                        const rewardTotal = entries
                          .filter((e) => e.amountChange > 0)
                          .reduce((sum, e) => sum + e.amountChange, 0);
                        const punishTotal = entries
                          .filter((e) => e.amountChange < 0)
                          .reduce((sum, e) => sum + Math.abs(e.amountChange), 0);
                         const dayExpenses = expenses.filter((e) => e.date === date);
                         const expenseTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                         const dayRewards = timeRewards.filter((r) => r.date === date);
                         const rewardAdd = dayRewards.filter((r) => r.type === 'add').reduce((s, r) => s + r.amount, 0);
                         const rewardSub = dayRewards.filter((r) => r.type === 'subtract').reduce((s, r) => s + r.amount, 0);
                         const netTotal = rewardTotal + rewardAdd - punishTotal - rewardSub - expenseTotal;

                        return (
                          <motion.div
                            key={date}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                            className="rounded-xl border border-border/50 overflow-hidden"
                          >
                            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                              <span className="text-sm font-medium">
                                {getDateLabel(date)}
                              </span>
                               <div className="flex items-center gap-3 text-xs">
                                 <span className="text-emerald-600 font-semibold tabular-nums">
                                   +{rewardTotal + rewardAdd}
                                 </span>
                                 <span className="text-red-500 font-semibold tabular-nums">
                                   -{punishTotal + rewardSub}
                                 </span>
                                 {expenseTotal > 0 && (
                                   <span className="text-amber-600 font-semibold tabular-nums">
                                     -{expenseTotal}
                                   </span>
                                 )}
                                <span
                                  className={`font-semibold tabular-nums ${
                                    netTotal >= 0 ? 'text-emerald-600' : 'text-red-500'
                                  }`}
                                >
                                  {netTotal >= 0 ? '+' : ''}
                                  {netTotal}
                                </span>
                              </div>
                            </div>
                            <div className="divide-y divide-border/30">
                              {entries.map((entry, j) => {
                                const isDelay = entry.delayDays !== undefined;
                                return (
                                  <div
                                    key={`${entry.itemId}-${j}`}
                                    className="flex items-center gap-3 px-4 py-2.5 group/entry"
                                  >
                                    {entry.completed ? (
                                      <div className="size-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <Check className="size-3.5 text-emerald-600" />
                                      </div>
                                    ) : (
                                      <div className="size-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                        <X className="size-3.5 text-red-500" />
                                      </div>
                                    )}
                                    <span className="text-sm flex-1 min-w-0 truncate">
                                      {entry.itemName}
                                      {isDelay && (
                                        <span className="ml-1.5 text-[10px] text-red-500 font-medium">
                                          延期第{entry.delayDays}天
                                        </span>
                                      )}
                                    </span>
                                    <span
                                      className={`text-sm font-semibold tabular-nums shrink-0 ${
                                        entry.amountChange >= 0
                                          ? 'text-emerald-600'
                                          : 'text-red-500'
                                      }`}
                                    >
                                      {entry.amountChange >= 0 ? '+' : ''}
                                      {entry.amountChange}
                                      {isDelay && (
                                        <span className="text-[10px] font-normal ml-0.5">
                                          ({Math.abs(entry.amountChange)}倍)
                                        </span>
                                      )}
                                    </span>
                                    {/* 👇 这里的悬停隐藏代码已被删除，垃圾桶现在永远可见 👇 */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => onDeleteEntry(date, j)}
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                               {/* 当日消费 */}
                               {dayExpenses.map((exp) => (
                                 <div
                                   key={exp.id}
                                   className="flex items-center gap-3 px-4 py-2.5 bg-amber-50/30"
                                 >
                                   <div className="size-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                     <ShoppingBag className="size-3.5 text-amber-600" />
                                   </div>
                                   <span className="text-sm flex-1 min-w-0 truncate text-muted-foreground">
                                     {exp.reason}
                                   </span>
                                   <span className="text-sm font-semibold tabular-nums shrink-0 text-amber-600">
                                     -{exp.amount}
                                   </span>
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                     onClick={() => onDeleteExpense(exp.id)}
                                   >
                                     <Trash2 className="size-3" />
                                   </Button>
                                 </div>
                               ))}
                               {/* 当日时间奖励 */}
                               {dayRewards.map((reward) => (
                                 <div
                                   key={reward.id}
                                   className="flex items-center gap-3 px-4 py-2.5 bg-primary/5"
                                 >
                                   <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                     <Clock className="size-3.5 text-primary" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <span className="text-sm">
                                       {reward.type === 'add' ? '增加余额' : '减少余额'}
                                     </span>
                                     <span className="block text-[10px] text-muted-foreground">
                                       {new Date(reward.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                   </div>
                                   <span className={`text-sm font-semibold tabular-nums shrink-0 ${reward.type === 'add' ? 'text-emerald-600' : 'text-red-500'}`}>
                                     {reward.type === 'add' ? '+' : '-'}{reward.amount}
                                   </span>
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                     onClick={() => onDeleteTimeReward(reward.id)}
                                   >
                                     <Trash2 className="size-3" />
                                   </Button>
                                 </div>
                               ))}
                            </div>
                          </motion.div>
                        );
                      })}

                       {/* 仅有消费/时间奖励无打卡的日期 */}
                       {[...new Set([...expenseDates, ...timeRewardDates])]
                         .filter((d) => !dates.includes(d))
                         .sort((a, b) => b.localeCompare(a))
                         .map((date, i) => {
                           const dayExpenses = expenses.filter((e) => e.date === date);
                           const expenseTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                           const dayRewards = timeRewards.filter((r) => r.date === date);
                           const rewardAdd = dayRewards.filter((r) => r.type === 'add').reduce((s, r) => s + r.amount, 0);
                           const rewardSub = dayRewards.filter((r) => r.type === 'subtract').reduce((s, r) => s + r.amount, 0);
                           const dayNet = rewardAdd - rewardSub - expenseTotal;

                          return (
                            <motion.div
                              key={`exp-${date}`}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: (dates.length + i) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                              className="rounded-xl border border-border/50 overflow-hidden"
                            >
                              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50">
                                <span className="text-sm font-medium">
                                  {getDateLabel(date)}
                                </span>
                               <div className="flex items-center gap-3 text-xs">
                                 {rewardAdd > 0 && (
                                   <span className="text-emerald-600 font-semibold tabular-nums">
                                     +{rewardAdd}
                                   </span>
                                 )}
                                 {rewardSub > 0 && (
                                   <span className="text-red-500 font-semibold tabular-nums">
                                     -{rewardSub}
                                   </span>
                                 )}
                                 {expenseTotal > 0 && (
                                   <span className="text-amber-600 font-semibold tabular-nums">
                                     -{expenseTotal}
                                   </span>
                                 )}
                                 <span
                                   className={`font-semibold tabular-nums ${
                                     dayNet >= 0 ? 'text-emerald-600' : 'text-red-500'
                                   }`}
                                 >
                                   {dayNet >= 0 ? '+' : ''}
                                   {dayNet}
                                 </span>
                               </div>
                              </div>
                               <div className="divide-y divide-border/30">
                                 {dayRewards.map((reward) => (
                                   <div
                                     key={reward.id}
                                     className="flex items-center gap-3 px-4 py-2.5 bg-primary/5"
                                   >
                                     <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                       <Clock className="size-3.5 text-primary" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <span className="text-sm">
                                         {reward.type === 'add' ? '增加余额' : '减少余额'}
                                       </span>
                                       <span className="block text-[10px] text-muted-foreground">
                                         {new Date(reward.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                     </div>
                                     <span className={`text-sm font-semibold tabular-nums shrink-0 ${reward.type === 'add' ? 'text-emerald-600' : 'text-red-500'}`}>
                                       {reward.type === 'add' ? '+' : '-'}{reward.amount}
                                     </span>
                                     <Button
                                       variant="ghost"
                                       size="icon"
                                       className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                       onClick={() => onDeleteTimeReward(reward.id)}
                                     >
                                       <Trash2 className="size-3" />
                                     </Button>
                                   </div>
                                 ))}
                                 {dayExpenses.map((exp) => (
                                   <div
                                     key={exp.id}
                                     className="flex items-center gap-3 px-4 py-2.5 bg-amber-50/30"
                                   >
                                     <div className="size-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                       <ShoppingBag className="size-3.5 text-amber-600" />
                                     </div>
                                     <span className="text-sm flex-1 min-w-0 truncate text-muted-foreground">
                                       {exp.reason}
                                     </span>
                                     <span className="text-sm font-semibold tabular-nums shrink-0 text-amber-600">
                                       -{exp.amount}
                                     </span>
                                     <Button
                                       variant="ghost"
                                       size="icon"
                                       className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                       onClick={() => onDeleteExpense(exp.id)}
                                     >
                                       <Trash2 className="size-3" />
                                     </Button>
                                   </div>
                                 ))}
                               </div>
                            </motion.div>
                          );
                        })}
                    </>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </section>
  );
}