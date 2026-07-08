import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  calculateTrendData,
  calculateCumulativeStats,
} from '@/data/tracker';
import type { ITrackerData } from '@/data/tracker';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendChartSectionProps {
  data: ITrackerData;
  selectedDate: string;
}

export default function TrendChartSection({ data, selectedDate }: TrendChartSectionProps) {
  const [days, setDays] = useState<7 | 30>(7);

  const trendData = useMemo(
    () => calculateTrendData(data, selectedDate, days),
    [data, selectedDate, days]
  );

  const cumulative = useMemo(() => calculateCumulativeStats(data), [data]);

  const chartData = useMemo(
    () =>
      trendData.map((d) => ({
        date: d.date.slice(5),
        balance: d.balance,
      })),
    [trendData]
  );

  const rewardColor = '#43A86E';
  const punishColor = '#D4654A';
  const balanceColor = '#D49A3C';

  return (
    <section className="w-full">
      <div className="max-w-5xl mx-auto px-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">余额趋势</CardTitle>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <Button
                  variant={days === 7 ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setDays(7)}
                >
                  7天
                </Button>
                <Button
                  variant={days === 30 ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setDays(30)}
                >
                  30天
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <motion.div
              key={days}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 15% 88%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(30 10% 45%)' }}
                    tickLine={false}
                    axisLine={false}
                    interval={days === 7 ? 0 : 4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(30 10% 45%)' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid hsl(35 15% 88%)',
                      fontSize: '13px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value}`, '余额']}
                    labelFormatter={(label: string) => `日期: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke={balanceColor}
                    strokeWidth={2}
                    dot={{ r: 3, fill: balanceColor, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: balanceColor, strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="size-3.5 text-emerald-600" />
                  <span className="text-[10px] text-muted-foreground">累计奖励</span>
                </div>
                <span className="text-base font-bold text-emerald-600 tabular-nums">
                  +{cumulative.totalReward}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="size-3.5 text-red-500" />
                  <span className="text-[10px] text-muted-foreground">累计惩罚</span>
                </div>
                <span className="text-base font-bold text-red-500 tabular-nums">
                  -{cumulative.totalPunish}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ShoppingBag className="size-3.5 text-amber-600" />
                  <span className="text-[10px] text-muted-foreground">累计消费</span>
                </div>
                <span className="text-base font-bold text-amber-600 tabular-nums">
                  -{cumulative.totalExpense}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Activity className="size-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground">净收益</span>
                </div>
                <span
                  className={`text-base font-bold tabular-nums ${
                    cumulative.netTotal >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {cumulative.netTotal >= 0 ? '+' : ''}
                  {cumulative.netTotal}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
