'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  Heart,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  Trash2,
  RefreshCw,
  Edit,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  UploadRecord,
  UploadFilters
} from '@/types/upload-record';
import { ResubmitModal } from './components/ResubmitModal';
import { useIntersectionObserverLegacy } from '@/hooks/useIntersectionObserver';
import { queryClient } from '@/lib/query-client';
import {
  useInfiniteUploadRecords,
  useUploadStats,
  useDeleteUploadRecordMutation,
  useWithdrawUploadRecordMutation,
  uploadRecordQueryUtils
} from '@/hooks/queries/useUploadRecords';
import { UploadRecordService } from '@/services/upload-record.service';

const USER_MEDIA_TAB_CONFIG = [
  { value: 'all', label: '全部', statKey: 'total' },
  { value: 'pending', label: '待审核', statKey: 'pending_review' },
  { value: 'approved', label: '已通过', statKey: 'approved' },
  { value: 'rejected', label: '已拒绝', statKey: 'rejected' },
  { value: 'deleted', label: '已删除', statKey: 'user_deleted' },
] as const;

const TAB_STATUS_MAP: Record<
  (typeof USER_MEDIA_TAB_CONFIG)[number]['value'],
  UploadFilters['status'] | undefined
> = {
  all: undefined,
  pending: 'PENDING_REVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  deleted: 'USER_DELETED',
};

export default function UserUploadsPage() {
  // 本地UI状态
  const [filters, setFilters] = useState<UploadFilters>({
    page: 0,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [editorRecord, setEditorRecord] = useState<UploadRecord | null>(null);
  const [editorMode, setEditorMode] = useState<'resubmit' | 'edit'>('resubmit');
  const [actionRecord, setActionRecord] = useState<{
    record: UploadRecord;
    mode: 'delete' | 'withdraw';
  } | null>(null);

  // 无限滚动引用
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 构建查询筛选参数
  const queryFilters = useMemo(() => ({
    ...filters,
    search: searchQuery.trim() || undefined,
  }), [filters, searchQuery]);

  // 使用TanStack Query获取数据
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteUploadRecords(queryFilters, 20);

  const { data: stats } = useUploadStats();

  // Mutation hooks
  const deleteRecordMutation = useDeleteUploadRecordMutation();
  const withdrawRecordMutation = useWithdrawUploadRecordMutation();
  const isWithdrawAction = actionRecord?.mode === 'withdraw';
  const actionMutationPending = actionRecord
    ? isWithdrawAction
      ? withdrawRecordMutation.isPending
      : deleteRecordMutation.isPending
    : false;
  const tabItems = USER_MEDIA_TAB_CONFIG.map((tab) => ({
    ...tab,
    count: stats ? (stats as Record<string, number>)[tab.statKey] ?? 0 : 0,
  }));

  // 合并所有页面的记录数据
  const records = useMemo(() => {
    return data?.pages.flatMap(page => page.records || []) || [];
  }, [data]);

  // 无限滚动监听
  useIntersectionObserverLegacy({
    target: loadMoreRef,
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    threshold: 0.1,
    rootMargin: '100px'
  });

  // 搜索处理
  const handleSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, search: searchQuery, page: 0 }));
  }, [searchQuery]);

  // 状态标签点击
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    const statusFilter =
      TAB_STATUS_MAP[
        value as (typeof USER_MEDIA_TAB_CONFIG)[number]['value']
      ];
    setFilters(prev => ({
      ...prev,
      status: statusFilter,
      page: 0
    }));
  }, []);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    refetch();
    uploadRecordQueryUtils.invalidateAll(queryClient);
  }, [refetch]);

  // 确认删除/撤回
  const handleConfirmDelete = useCallback(() => {
    if (!actionRecord) return;

    const { record, mode } = actionRecord;
    const onSettled = () => setActionRecord(null);

    if (mode === 'withdraw') {
      withdrawRecordMutation.mutate(record.id, {
        onSuccess: () => handleRefresh(),
        onSettled,
      });
      return;
    }

    deleteRecordMutation.mutate(record.id, {
      onSuccess: () => handleRefresh(),
      onSettled,
    });
  }, [actionRecord, deleteRecordMutation, withdrawRecordMutation, handleRefresh]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          媒体管理
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          统一管理你的投稿，随时掌握审核状态并快速编辑、撤回或删除
        </p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    总上传数
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    通过率
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.approval_rate}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    总浏览量
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.total_views.toLocaleString()}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    总点赞数
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.total_likes.toLocaleString()}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选和搜索 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索标题或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} className="px-6">
            搜索
          </Button>
        </div>

        {/* 状态标签 */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label} ({tab.count})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 记录列表 */}
      <div className="space-y-4">
        {records.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                暂无媒体内容
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                快去上传或创作你的第一个作品吧！
              </p>
            </div>
        ) : (
          records.map((record) => (
            <UploadRecordCard
              key={record.id}
              record={record}
              onDelete={(record) =>
                setActionRecord({ record, mode: 'delete' })
              }
              onWithdraw={(record) =>
                setActionRecord({ record, mode: 'withdraw' })
              }
              onOpenEditor={(target, mode) => {
                setEditorMode(mode);
                setEditorRecord(target);
              }}
            />
          ))
        )}

        {/* 无限滚动触发器 */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
          </div>
        )}

        {/* 手动加载更多按钮（备用） */}
        {hasNextPage && !isFetchingNextPage && (
          <div className="text-center py-6">
            <Button
              onClick={() => fetchNextPage()}
              variant="outline"
            >
              加载更多
            </Button>
          </div>
        )}

        {/* 没有更多内容提示 */}
        {!hasNextPage && records.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            已显示全部媒体内容
          </div>
        )}
      </div>

      {/* 重新提交模态框 */}
      <ResubmitModal
        isOpen={!!editorRecord}
        mode={editorMode}
        onClose={() => setEditorRecord(null)}
        record={editorRecord}
        onSuccess={() => {
          setEditorRecord(null);
          handleRefresh();
        }}
      />

      {/* 删除/撤回确认弹框 */}
      <Dialog open={!!actionRecord} onOpenChange={() => setActionRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className={`flex items-center gap-2 ${
                isWithdrawAction ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              {isWithdrawAction ? (
                <Clock className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              {isWithdrawAction ? '确认撤回' : '确认删除'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {isWithdrawAction
                ? '撤回后作品将不再参与审核，可重新编辑或删除。'
                : ''}
            </DialogDescription>
          </DialogHeader>

          {actionRecord?.record && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                {actionRecord.record.thumbnail_url ? (
                  <img
                    src={actionRecord.record.thumbnail_url}
                    alt={actionRecord.record.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {actionRecord.record.media_type === 'VIDEO' ? (
                      <Video className="h-6 w-6 text-gray-400" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {actionRecord.record.title}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {actionRecord.record.media_type === 'VIDEO' ? '视频' : '图片'} •
                  {UploadRecordService.getStatusText(actionRecord.record.status)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setActionRecord(null)}
              disabled={actionMutationPending}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              variant={isWithdrawAction ? 'default' : 'destructive'}
              onClick={handleConfirmDelete}
              disabled={actionMutationPending}
              className="w-full sm:w-auto"
            >
              {actionMutationPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  处理中...
                </>
              ) : (
                <>
                  {isWithdrawAction ? (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isWithdrawAction ? '确认撤回' : '确认删除'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 上传记录卡片组件
interface UploadRecordCardProps {
  record: UploadRecord;
  onDelete: (record: UploadRecord) => void;
  onWithdraw: (record: UploadRecord) => void;
  onOpenEditor: (record: UploadRecord, mode: 'resubmit' | 'edit') => void;
}

const UploadRecordCard: React.FC<UploadRecordCardProps> = ({
  record,
  onDelete,
  onWithdraw,
  onOpenEditor
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPending = record.status === 'PENDING_REVIEW';
  const isRejected = record.status === 'REJECTED';
  const isApproved = record.status === 'APPROVED';
  const isUserDeleted = record.status === 'USER_DELETED';
  const isAdminDeleted = record.status === 'ADMIN_DELETED';
  const isSystemHidden = record.status === 'SYSTEM_HIDDEN';
  const statusNotice = isUserDeleted
    ? '你已删除该作品，其他用户将不再看到它。'
    : isAdminDeleted
    ? '作品因管理员处理已被移除。'
    : isSystemHidden
    ? '作品因系统策略暂不可见。'
    : null;
  const canDelete = isRejected || isApproved;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* 缩略图 */}
          <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            {record.thumbnail_url ? (
              <img
                src={record.thumbnail_url}
                alt={record.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {record.media_type === 'VIDEO' ? (
                  <Video className="h-8 w-8 text-gray-400" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
            )}
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-4">
                {record.title}
              </h3>
              <Badge className={UploadRecordService.getStatusColor(record.status)}>
                {UploadRecordService.getStatusText(record.status)}
              </Badge>
            </div>

            {record.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {record.description}
              </p>
            )}

            {/* 元数据 */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(record.created_at)}
              </span>
              <span>{UploadRecordService.formatFileSize(record.size)}</span>
              {record.duration && (
                <span>{UploadRecordService.formatDuration(record.duration)}</span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {record.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {record.likes_count}
              </span>
            </div>

            {/* 审核信息 */}
            {record.review_comment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-800">
                  <strong>审核备注：</strong>{record.review_comment}
                </p>
                {record.reviewer && (
                  <p className="text-xs text-yellow-600 mt-1">
                    审核员：{record.reviewer.nickname || record.reviewer.username}
                    {record.reviewed_at && ` • ${formatDate(record.reviewed_at)}`}
                  </p>
                )}
              </div>
            )}

            {statusNotice && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-600">{statusNotice}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? '收起' : '详情'}
              </Button>

              {isPending && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenEditor(record, 'edit')}
                  className="text-gray-700 border-gray-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  编辑
                </Button>
              )}

              {isPending && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onWithdraw(record)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  撤回
                </Button>
              )}

              {isRejected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenEditor(record, 'resubmit')}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重新提交
                </Button>
              )}

              {canDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(record)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 详细信息展开区域 */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* 分类和标签 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">分类</h4>
                <Badge variant="secondary">
                  {record.category?.name || '未分类'}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">标签</h4>
                <div className="flex flex-wrap gap-1">
                  {record.tags.length > 0 ? (
                    record.tags.map(tag => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">暂无标签</span>
                  )}
                </div>
              </div>
            </div>

            {/* 技术信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">类型：</span>
                <span className="ml-1">{record.media_type === 'VIDEO' ? '视频' : '图片'}</span>
              </div>
              {record.width && record.height && (
                <div>
                  <span className="text-gray-500">尺寸：</span>
                  <span className="ml-1">{record.width} × {record.height}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">上传时间：</span>
                <span className="ml-1">{formatDate(record.created_at)}</span>
              </div>
              {record.updated_at !== record.created_at && (
                <div>
                  <span className="text-gray-500">更新时间：</span>
                  <span className="ml-1">{formatDate(record.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
