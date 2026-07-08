import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, LogOut, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getUserId, setUserId, clearUserId, getDefaultItems } from '@/data/tracker';
import { loadLocalData, saveLocalData, loadFromCloud, saveToCloud } from '@/services/api';

export default function UserSetupPage() {
  const navigate = useNavigate();
  const [existingUser, setExistingUser] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState('');
  const [showSwitchInput, setShowSwitchInput] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uid = getUserId();
    if (uid) {
      setExistingUser(uid);
    }
  }, []);

  const handleSetUser = async () => {
    const code = syncCode.trim();
    if (!code) {
      toast.error('请输入同步码');
      return;
    }
    setLoading(true);
    setUserId(code);

    // 先检查本地缓存
    const localData = loadLocalData(code);
    const hasLocalData = localData.items.length > 0;

    // 尝试从云端加载
    const cloudData = await loadFromCloud(code);

    if (cloudData) {
      // 云端有数据，使用云端数据（已自动更新本地缓存）
      toast.success(`欢迎回来，${code}！`);
    } else if (hasLocalData) {
      // 本地有数据但云端没有，同步到云端
      saveToCloud(code, localData).catch(() => {});
      toast.success(`欢迎回来，${code}！`);
    } else {
      // 首次使用 - 初始化默认事项
      const initialData = {
        items: getDefaultItems(),
        records: {},
        initialBalance: 0,
        expenses: [],
        timeRewards: [],
      };
      saveLocalData(code, initialData);
      // 后台同步到云端
      saveToCloud(code, initialData).catch(() => {});
      toast.success('已创建新账号，已添加示例任务');
    }

    setLoading(false);
    navigate('/', { replace: true });
  };

  const handleContinue = () => {
    navigate('/', { replace: true });
  };

  const handleSwitchUser = () => {
    clearUserId();
    setExistingUser(null);
    setShowSwitchInput(false);
    setSyncCode('');
    toast.info('已退出当前账号');
  };

  const handleSwitchToNew = async () => {
    const code = syncCode.trim();
    if (!code) {
      toast.error('请输入同步码');
      return;
    }
    setLoading(true);
    setUserId(code);

    // 先检查本地缓存
    const localData = loadLocalData(code);
    const hasLocalData = localData.items.length > 0;

    // 尝试从云端加载
    const cloudData = await loadFromCloud(code);

    if (cloudData) {
      toast.success(`已切换到 ${code}`);
    } else if (hasLocalData) {
      saveToCloud(code, localData).catch(() => {});
      toast.success(`已切换到 ${code}`);
    } else {
      const initialData = {
        items: getDefaultItems(),
        records: {},
        initialBalance: 0,
        expenses: [],
        timeRewards: [],
      };
      saveLocalData(code, initialData);
      saveToCloud(code, initialData).catch(() => {});
      toast.success('已创建新账号并切换');
    }

    setLoading(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="size-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg"
          >
            <span className="text-primary-foreground text-2xl font-bold">奖</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">奖励打卡</h1>
          <p className="text-sm text-muted-foreground mt-1">
            用打卡记录每一天的成长
          </p>
        </div>

        {existingUser && !showSwitchInput ? (
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="size-12 mx-auto mb-3 rounded-full bg-accent flex items-center justify-center">
                <User className="size-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-lg">欢迎回来</CardTitle>
              <CardDescription>
                <span className="font-semibold text-foreground">{existingUser}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2" onClick={handleContinue}>
                继续打卡
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowSwitchInput(true)}
              >
                <LogOut className="size-4" />
                切换账号
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg">
                {existingUser ? '切换账号' : '设置同步码'}
              </CardTitle>
              <CardDescription>
                {existingUser
                  ? '输入新的同步码以切换账号'
                  : '设置一个同步码用于区分不同用户的数据'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sync-code">同步码</Label>
                <Input
                  id="sync-code"
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  placeholder="输入你的同步码"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      existingUser ? handleSwitchToNew() : handleSetUser();
                    }
                  }}
                />
              </div>
               <Button
                className="w-full gap-2"
                onClick={existingUser ? handleSwitchToNew : handleSetUser}
                disabled={loading}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {existingUser ? '切换并进入' : '开始使用'}
                {!loading && <ArrowRight className="size-4" />}
              </Button>
              {existingUser && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleSwitchUser}
                >
                  取消
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
