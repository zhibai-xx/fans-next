'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useReview } from '@/hooks/useReview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ModernMediaDetailModal } from './ModernMediaDetailModal';
import {
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Grid3x3,
  List,
  RefreshCw,
  Settings,
  ImageIcon,
  VideoIcon,
  Trash2,
  Play
} from 'lucide-react';
import { ReviewService } from '@/services/review.service';
import { resolveMediaImageUrl } from '@/lib/utils/media-url';

// 审核媒体项 - 对齐内容管理页面的封面逻辑
const MediaItem = memo(({ media, isSelected, viewMode, onToggle, onViewDetail }: {
  media: any;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  onToggle: (id: string) => void;
  onViewDetail: (media: any) => void;
}) => {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const previewUrl = resolveMediaImageUrl(media.thumbnail_url || media.url);
  const isVideo = media.media_type === 'VIDEO';

  const handleToggleSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(media.id);
  };

  const handleViewDetail = () => onViewDetail(media);

  const renderThumbnail = (wrapperClass: string) => (
    <div className={`relative ${wrapperClass} bg-gray-100 flex items-center justify-center`}>
      {!thumbnailLoaded && !thumbnailError && <ImageIcon className="h-10 w-10 text-gray-300" />}
      {!thumbnailError ? (
        <img
          src={previewUrl}
          alt={media.title}
          className={`h-full w-full object-contain transition-opacity duration-200 ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setThumbnailLoaded(true)}
          onError={() => setThumbnailError(true)}
        />
      ) : (
        <div className="text-center text-xs text-gray-400">封面加载失败</div>
      )}
      {isVideo && !thumbnailError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-3 shadow-md">
            <Play className="h-8 w-8 text-white" />
          </div>
        </div>
      )}
      {isVideo && media.duration && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
          {`${Math.floor(media.duration / 60)}:${(media.duration % 60).toString().padStart(2, '0')}`}
        </div>
      )}
    </div>
  );

  const containerClass = `media-item border rounded-lg overflow-hidden cursor-pointer ${
    isSelected ? 'media-item-selected' : 'media-item-unselected'
  }`;

  if (viewMode === 'grid') {
    return (
      <div className={containerClass} onClick={handleViewDetail}>
        <div className="relative overflow-hidden rounded-lg">
          <button
            type="button"
            className="absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-white/80 hover:bg-white transition"
            onClick={handleToggleSelection}
          >
            {isSelected ? <CheckCircle className="h-4 w-4 text-blue-600" /> : <div className="h-4 w-4 rounded-sm border border-gray-400" />}
          </button>
          {renderThumbnail('aspect-video')}
        </div>
        <div className="p-3 space-y-1">
          <h4 className="font-medium text-sm truncate">{media.title || '未命名媒体'}</h4>
          <p className="text-xs text-gray-600 truncate">{media.user.username} • {media.media_type}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass} onClick={handleViewDetail}>
      <div className="flex items-center p-3 space-x-3">
        <button
          type="button"
          className="flex-shrink-0 h-7 w-7 bg-white border border-gray-300 rounded-md flex items-center justify-center"
          onClick={handleToggleSelection}
        >
          {isSelected ? <CheckCircle className="h-4 w-4 text-blue-600" /> : <div className="h-4 w-4 rounded-sm border border-gray-400" />}
        </button>
        <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
          {renderThumbnail('w-full h-full')}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{media.title || '未命名媒体'}</h4>
          <p className="text-xs text-gray-600 mt-1 truncate">{media.user.username} • {media.media_type} • {media.status}</p>
        </div>
        {isSelected && <CheckCircle className="h-5 w-5 text-blue-500" />}
      </div>
    </div>
  );
});
MediaItem.displayName = 'MediaItem';

// 优化的媒体网格组件
const MediaGrid = memo(({
  mediaList,
  viewMode,
  selectedItems,
  onToggle,
  onViewDetail
}: {
  mediaList: any[];
  viewMode: 'grid' | 'list';
  selectedItems: Set<string>;
  onToggle: (id: string) => void;
  onViewDetail: (media: any) => void;
}) => {
  // 使用优化的网格类
  const gridClass = `media-grid ${viewMode === 'grid'
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    : "space-y-2"}`;

  return (
    <div className={gridClass}>
      {mediaList.map((media, index) => {
        return (
          <MediaItem
            key={media.id}
            media={media}
            isSelected={selectedItems.has(media.id)}
            viewMode={viewMode}
            onToggle={onToggle}
            onViewDetail={onViewDetail}
          />
        );
      })}
    </div>
  );
});

MediaGrid.displayName = 'MediaGrid';

export function ReviewDashboard() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null); // 用于存储选中的媒体详情
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const review = useReview({
    status: 'PENDING_REVIEW',
    take: 20,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const {
    stats,
    mediaList,
    isLoading,
    error,
    selectedItems,
    selectionState,
    updateFilters,
    toggleSelection,
    selectAll,
    clearSelection,
    batchApprove,
    batchReject,
    batchDelete,
    refreshMediaList,
    currentFilters,
    refreshStats
  } = review;

  // 稳定的事件处理函数
  const handleRefresh = useCallback(() => refreshMediaList(false), [refreshMediaList]);

  const handleStatusFilter = useCallback((status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED') => {
    updateFilters({ status, skip: 0 });

    // 切换筛选时也刷新统计，确保数字是最新的
    setTimeout(() => {
      review.refreshStats();
    }, 100);
  }, [updateFilters, review]);

  const handleTypeFilter = useCallback((type: 'IMAGE' | 'VIDEO') => {
    const newType = currentFilters.type === type ? undefined : type;
    updateFilters({ type: newType, skip: 0 });
  }, [updateFilters, currentFilters.type]);

  // 预计算的筛选按钮状态，避免重复计算
  const filterStates = useMemo(() => ({
    isPending: currentFilters.status === 'PENDING_REVIEW',
    isApproved: currentFilters.status === 'APPROVED',
    isRejected: currentFilters.status === 'REJECTED',
    isImageFilter: currentFilters.type === 'IMAGE',
    isVideoFilter: currentFilters.type === 'VIDEO'
  }), [currentFilters.status, currentFilters.type]);

  // 根据当前筛选状态判断可进行的批量操作
  const canBatchApprove = currentFilters.status === 'PENDING_REVIEW' && selectionState.hasSelection;
  const canBatchReject = currentFilters.status === 'PENDING_REVIEW' && selectionState.hasSelection;
  const canBatchWithdrawRejection = currentFilters.status === 'REJECTED' && selectionState.hasSelection;
  const canBatchDelete = selectionState.hasSelection; // 所有状态都可以删除

  // 批量操作处理
  const handleBatchApprove = useCallback(async () => {
    if (!canBatchApprove) return;
    await batchApprove();
  }, [batchApprove, canBatchApprove]);

  const handleBatchReject = useCallback(async () => {
    if (!canBatchReject) return;
    await batchReject();
  }, [batchReject, canBatchReject]);

  const handleBatchWithdrawRejection = useCallback(async () => {
    if (!canBatchWithdrawRejection) return;
    // 使用批量状态更新，将已拒绝改为待审核
    try {
      const selectedIds = Array.from(selectedItems);
      await ReviewService.batchUpdateStatus({
        mediaIds: selectedIds,
        status: 'PENDING_REVIEW'
      });

      // 刷新数据
      refreshMediaList(false);
      refreshStats();
    } catch (error) {
      console.error('批量撤回拒绝失败:', error);
    }
  }, [selectedItems, canBatchWithdrawRejection, refreshMediaList, refreshStats]);

  const handleBatchDelete = useCallback(() => {
    if (!canBatchDelete) return;
    setShowDeleteDialog(true);
  }, [canBatchDelete]);

  const confirmBatchDelete = useCallback(async () => {
    setShowDeleteDialog(false);
    await batchDelete();
  }, [batchDelete]);

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            selectAll();
          }
          break;
        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleRefresh();
          }
          break;
        case '?':
          event.preventDefault();
          setShowShortcuts(true);
          break;
        case 'Escape':
          event.preventDefault();
          clearSelection();
          setShowShortcuts(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectAll, clearSelection, handleRefresh]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-800 mb-2">加载失败</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">媒体审核</h1>
          <p className="text-gray-600 mt-1">管理和审核用户上传的媒体内容</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            快捷键
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 - 简化渲染 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待审核</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoading ? '...' : stats?.pending || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已通过</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? '...' : stats?.approved || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已拒绝</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoading ? '...' : stats?.rejected || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? '...' : stats?.total || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">快速筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStates.isPending ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('PENDING_REVIEW')}
            >
              <Clock className="h-4 w-4 mr-2" />
              待审核 ({stats?.pending || 0})
            </Button>
            <Button
              variant={filterStates.isApproved ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('APPROVED')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              已通过 ({stats?.approved || 0})
            </Button>
            <Button
              variant={filterStates.isRejected ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilter('REJECTED')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              已拒绝 ({stats?.rejected || 0})
            </Button>
            <Button
              variant={filterStates.isImageFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTypeFilter('IMAGE')}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              图片
            </Button>
            <Button
              variant={filterStates.isVideoFilter ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTypeFilter('VIDEO')}
            >
              <VideoIcon className="h-4 w-4 mr-2" />
              视频
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作工具栏 */}
      {selectionState.hasSelection && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-800">
                  已选择 {selectionState.selectedCount} 项
                </span>
                <div className="flex gap-2">
                  {/* 只有待审核状态可以批量通过 */}
                  {filterStates.isPending && (
                    <Button
                      size="sm"
                      onClick={handleBatchApprove}
                      disabled={isLoading || !canBatchApprove}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      批量通过
                    </Button>
                  )}

                  {/* 只有待审核状态可以批量拒绝 */}
                  {filterStates.isPending && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBatchReject}
                      disabled={isLoading || !canBatchReject}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      批量拒绝
                    </Button>
                  )}

                  {/* 已拒绝状态可以批量撤回拒绝 */}
                  {filterStates.isRejected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchWithdrawRejection}
                      disabled={isLoading || !canBatchWithdrawRejection}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      批量撤回拒绝
                    </Button>
                  )}

                  {/* 已通过状态提示去媒体管理页面 */}
                  {filterStates.isApproved && (
                    <div className="text-sm text-gray-600 py-2 px-3 bg-gray-100 rounded">
                      已通过的内容请到媒体管理页面进行管理
                    </div>
                  )}

                  {/* 批量删除按钮 - 只在已拒绝状态下显示 */}
                  {filterStates.isRejected && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBatchDelete}
                      disabled={isLoading || !canBatchDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      批量删除
                    </Button>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={clearSelection}>
                取消选择
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 媒体列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              媒体列表
              {stats && (
                <Badge variant="secondary" className="ml-2">
                  {filterStates.isPending ? `${stats.pending} 待审核` :
                    filterStates.isApproved ? `${stats.approved} 已通过` :
                      filterStates.isRejected ? `${stats.rejected} 已拒绝` :
                        `${stats.total} 总计`}
                </Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              {selectionState.hasSelection && (
                <div className="text-sm text-gray-600">
                  已选择 {selectionState.selectedCount} / {selectionState.totalCount} 项
                </div>
              )}

              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 rounded-lg aspect-square"></div>
                  <div className="mt-2 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : mediaList.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
              <p className="text-gray-600">
                {filterStates.isPending ? '暂无待审核的媒体' :
                  filterStates.isApproved ? '暂无已通过的媒体' :
                    filterStates.isRejected ? '暂无已拒绝的媒体' :
                      '暂无媒体数据'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectionState.isAllSelected}
                >
                  全选
                </Button>
                <p className="text-sm text-gray-600">显示 {mediaList.length} 项</p>
              </div>

              {/* 使用优化的媒体网格组件 */}
              <MediaGrid
                mediaList={mediaList}
                viewMode={viewMode}
                selectedItems={selectedItems}
                onToggle={toggleSelection}
                onViewDetail={(media) => setSelectedMedia(media)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 媒体详情模态框 */}
      <ModernMediaDetailModal
        media={selectedMedia}
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onUpdate={(updatedMedia) => {
          // 更新媒体列表中的对应项
          refreshMediaList(false);
          refreshStats();
          setSelectedMedia(null);
        }}
      />

      {/* 快捷键帮助 */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>快捷键帮助</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>全选</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Ctrl+A</code>
                </div>
                <div className="flex justify-between">
                  <span>刷新</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Ctrl+R</code>
                </div>
                <div className="flex justify-between">
                  <span>显示帮助</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">?</code>
                </div>
                <div className="flex justify-between">
                  <span>取消选择/关闭</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Esc</code>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={() => setShowShortcuts(false)} className="w-full">
                  关闭
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 删除确认弹框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectionState.selectedCount} 项内容吗？此操作将永久删除这些内容及相关文件，无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
