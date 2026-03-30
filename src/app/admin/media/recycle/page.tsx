'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  useCleanupRecycleMutation,
  useHardDeleteRecycleMutation,
  usePendingCleanupQuery,
  useRecycleBinQuery,
  useRestoreRecycleMutation,
} from '@/hooks/queries/useMediaRecycle';
import { RecycleMediaItem } from '@/services/admin-media.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Eraser,
  Clock,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 20, 30];

type ConfirmState =
  | { type: 'restore'; ids: string[] }
  | { type: 'hard-delete'; ids: string[] }
  | null;

interface StatCardProps {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  value: number | string;
  note: string;
}

const StatCard: React.FC<StatCardProps> = ({ Icon, color, title, value, note }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className={`h-4 w-4 ${color}`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      <p className="mt-1 text-xs text-gray-500">{note}</p>
    </CardContent>
  </Card>
);

const renderSchedule = (item: RecycleMediaItem) => {
  if (!item.cleanup_scheduled_at) {
    return <span className="text-xs text-gray-500">未计划</span>;
  }

  const scheduled = new Date(item.cleanup_scheduled_at);
  const expired = scheduled.getTime() <= Date.now();

  return (
    <span className="flex items-center gap-1 text-xs text-gray-600">
      <Clock className="h-3.5 w-3.5 text-blue-500" />
      {formatDistanceToNow(scheduled, { addSuffix: true, locale: zhCN })}
      <span className={expired ? 'text-red-500' : 'text-gray-500'}>
        {expired ? '(待硬删)' : ''}
      </span>
    </span>
  );
};

export default function MediaRecyclePage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLimit, setCleanupLimit] = useState(50);
  const [cleanupReason, setCleanupReason] = useState('定期清理');
  const [createBackup, setCreateBackup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, search ? 300 : 0);

    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
    }),
    [page, limit, debouncedSearch],
  );

  const recycleQuery = useRecycleBinQuery(queryParams);
  const pendingQuery = usePendingCleanupQuery(100);
  const restoreMutation = useRestoreRecycleMutation();
  const hardDeleteMutation = useHardDeleteRecycleMutation();
  const cleanupMutation = useCleanupRecycleMutation();

  const items = useMemo(() => recycleQuery.data?.data ?? [], [recycleQuery.data]);
  const pagination = recycleQuery.data?.pagination;
  const selectedIdsInView = useMemo(() => {
    const itemIdSet = new Set(items.map((item) => item.id));
    return selectedIds.filter((id) => itemIdSet.has(id));
  }, [items, selectedIds]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id),
    );
  };

  const isBusy =
    recycleQuery.isFetching ||
    restoreMutation.isPending ||
    hardDeleteMutation.isPending ||
    cleanupMutation.isPending;

  const stats: StatCardProps[] = [
    {
      Icon: History,
      color: 'text-blue-500',
      title: '回收站总量',
      value: pagination?.total ?? '-',
      note: '软删但未恢复的媒体',
    },
    {
      Icon: ShieldCheck,
      color: 'text-emerald-500',
      title: '已选待恢复',
      value: selectedIdsInView.length,
      note: '确认后恢复原状态',
    },
    {
      Icon: ShieldAlert,
      color: 'text-red-500',
      title: '待硬删排队',
      value: pendingQuery.data?.pagination.total ?? '-',
      note: '超期媒体等待自动处理',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">回收站管理</h1>
        <p className="text-sm text-gray-600">
          按照 7-30 天的保留策略管理软删内容，可在此恢复、执行硬删或手动触发清理任务。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 gap-3">
          <Input
            placeholder="按标题或描述搜索..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="h-10 rounded-md border border-gray-200 px-3 text-sm text-gray-700"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                每页 {size} 条
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => recycleQuery.refetch()}
            disabled={recycleQuery.isFetching}
          >
            {recycleQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            刷新
          </Button>
          <Button
            className="gap-2"
            disabled={selectedIdsInView.length === 0 || restoreMutation.isPending}
            onClick={() => setConfirmState({ type: 'restore', ids: selectedIdsInView })}
          >
            <RotateCcw className="h-4 w-4" />
            恢复
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            disabled={selectedIdsInView.length === 0 || hardDeleteMutation.isPending}
            onClick={() => setConfirmState({ type: 'hard-delete', ids: selectedIdsInView })}
          >
            <Trash2 className="h-4 w-4" />
            彻底删除
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setCleanupDialogOpen(true)}
            disabled={cleanupMutation.isPending}
          >
            {cleanupMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eraser className="h-4 w-4" />
            )}
            手动清理
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Checkbox
          checked={items.length > 0 && selectedIdsInView.length === items.length}
          onCheckedChange={(checked) =>
            setSelectedIds(checked ? items.map((item) => item.id) : [])
          }
        />
        <span>
          已选 {selectedIdsInView.length} 项（共 {pagination?.total ?? 0} 项）
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="border border-gray-200 transition-colors hover:border-blue-200"
          >
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIdsInView.includes(item.id)}
                    onCheckedChange={(checked) => toggleSelect(item.id, !!checked)}
                  />
                  <div className="space-y-1">
                    <p className="line-clamp-2 text-base font-medium text-gray-900">
                      {item.title || '未命名媒体'}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {item.id} ｜ 作者: {item.user?.username ?? '未知'} ｜ 类型:{' '}
                      {item.media_type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-600"
                    onClick={() => restoreMutation.mutate([item.id])}
                    disabled={restoreMutation.isPending}
                  >
                    恢复
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => setConfirmState({ type: 'hard-delete', ids: [item.id] })}
                    disabled={hardDeleteMutation.isPending}
                  >
                    删除
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-3">
                <div>
                  <span className="block text-gray-500">删除时间</span>
                  <span>
                    {format(new Date(item.deleted_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}（
                    {formatDistanceToNow(new Date(item.deleted_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                    ）
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500">计划硬删</span>
                  {renderSchedule(item)}
                </div>
                <div>
                  <span className="block text-gray-500">删除原因</span>
                  <span>{item.deleted_reason || '无记录'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && !recycleQuery.isLoading && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-500">
            当前暂无回收站内容。
          </div>
        )}

        {recycleQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载，请稍候...
          </div>
        )}
      </div>

      {pagination && (
        <div className="flex items-center justify-between rounded-2xl border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <span>
            共 {pagination.total} 条，当前第 {pagination.page}/{pagination.totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isBusy || pagination.page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isBusy || pagination.page >= pagination.totalPages}
              onClick={() =>
                setPage((prev) => Math.min(pagination.totalPages, prev + 1))
              }
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmState !== null} onOpenChange={(open) => !open && setConfirmState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmState?.type === 'restore'
                ? '确认恢复所选媒体？'
                : '确认彻底删除所选媒体？'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState?.type === 'restore'
                ? '恢复后媒体将回到原可见状态。'
                : '彻底删除后无法恢复，请谨慎操作。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmState) return;
                if (confirmState.type === 'restore') {
                  restoreMutation.mutate(confirmState.ids);
                } else {
                  hardDeleteMutation.mutate({ mediaIds: confirmState.ids });
                }
                setConfirmState(null);
              }}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>手动触发硬删任务</AlertDialogTitle>
            <AlertDialogDescription>
              将立即把指定数量的超期媒体加入 BullMQ 队列，由 Worker 执行彻底删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <label className="space-y-1">
              <span className="text-gray-700">单批数量（1-200）</span>
              <Input
                type="number"
                min={1}
                max={200}
                value={cleanupLimit}
                onChange={(event) =>
                  setCleanupLimit(Math.min(200, Math.max(1, Number(event.target.value) || 1)))
                }
              />
            </label>
            <label className="space-y-1">
              <span className="text-gray-700">备注原因</span>
              <Input
                value={cleanupReason}
                onChange={(event) => setCleanupReason(event.target.value)}
                placeholder="例如：释放空间"
              />
            </label>
            <label className="flex items-center gap-2 text-gray-700">
              <Checkbox
                checked={createBackup}
                onCheckedChange={(checked) => setCreateBackup(!!checked)}
              />
              同时保留备份记录
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cleanupMutation.mutate({
                  limit: cleanupLimit,
                  reason: cleanupReason.trim() || undefined,
                  createBackup,
                });
                setCleanupDialogOpen(false);
              }}
            >
              立即提交
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
