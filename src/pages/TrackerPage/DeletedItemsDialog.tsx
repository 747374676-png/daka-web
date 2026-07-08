import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useState } from 'react';
import type { IItem } from '@/data/tracker';

interface DeletedItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedItems: IItem[];
  onRestore: (itemId: string) => void;
  onPermanentDelete: (itemId: string) => void;
}

export default function DeletedItemsDialog({
  open,
  onOpenChange,
  deletedItems,
  onRestore,
  onPermanentDelete,
}: DeletedItemsDialogProps) {
  const [permDeleteTarget, setPermDeleteTarget] = useState<string | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>已删除的事项</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-80 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {deletedItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8 text-center"
                >
                  <p className="text-sm text-muted-foreground">没有已删除的事项</p>
                </motion.div>
              ) : (
                deletedItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ±{item.amount}元 ·{' '}
                        {item.repeatType === 'daily' ? '每日' : '一次性'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onRestore(item.id)}
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setPermDeleteTarget(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!permDeleteTarget}
        onOpenChange={() => setPermDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>永久删除事项</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除该事项及其所有关联的打卡记录，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (permDeleteTarget) onPermanentDelete(permDeleteTarget);
                setPermDeleteTarget(null);
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
