'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useReview } from '@/hooks/useReview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MediaDetailModal } from './MediaDetailModal';
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
  VideoIcon
} from 'lucide-react';
import { ReviewService } from '@/services/review.service';

// 极简高性能的媒体项组件 - 使用优化的CSS类
const MediaItem = memo(({ media, isSelected, viewMode, onToggle, onViewDetail }: {
  media: any;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  onToggle: (id: string) => void;
  onViewDetail: (media: any) => void;
}) => {
  // 使用预定义的CSS类，避免运行时计算
  const containerClass = `media-item border rounded-lg overflow-hidden cursor-pointer ${isSelected ? "media-item-selected" : "media-item-unselected"
    }`;

  // 直接的点击处理
  const handleClick = () => onToggle(media.id);

  // 查看详情处理（阻止事件冒泡）
  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetail(media);
  };

  if (viewMode === 'grid') {
    return (
      <div className={containerClass} onClick={handleClick}>
        <div className="aspect-square bg-gray-100 relative group rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={media.thumbnail_url || media.url}
            alt=""
            className="media-image max-w-full max-h-full object-contain"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
          {/* 选中状态 */}
          {isSelected && (
            <div className="absolute top-2 right-2" style={{ transform: 'translateZ(0)' }}>
              <CheckCircle className="h-6 w-6 text-blue-500 bg-white rounded-full" />
            </div>
          )}
          {/* 查看详情按钮 - hover时显示 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={handleViewDetail}
            >
              <Eye className="h-4 w-4 mr-1" />
              详情
            </Button>
          </div>
        </div>
        <div className="p-3">
          <h4 className="font-medium text-sm truncate">{media.title}</h4>
          <p className="text-xs text-gray-600 mt-1">
            {media.user.username} • {media.media_type}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass} onClick={handleClick}>
      <div className="flex items-center p-3 space-x-3">
        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src={media.thumbnail_url || media.url}
            alt=""
            className="media-image max-w-full max-h-full object-contain"
            loading="lazy"
            decoding="async"
            sizes="64px"
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{media.title}</h4>
          <p className="text-xs text-gray-600 mt-1">
            {media.user.username} • {media.media_type} • {media.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleViewDetail}
            className="p-1 h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {isSelected && (
            <CheckCircle className="h-5 w-5 text-blue-500" style={{ transform: 'translateZ(0)' }} />
          )}
        </div>
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

  const review = useReview({
    status: 'PENDING',
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
    refreshMediaList,
    currentFilters,
    refreshStats
  } = review;

  // 稳定的事件处理函数
  const handleRefresh = useCallback(() => refreshMediaList(false), [refreshMediaList]);

  const handleStatusFilter = useCallback((status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
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
    isPending: currentFilters.status === 'PENDING',
    isApproved: currentFilters.status === 'APPROVED',
    isRejected: currentFilters.status === 'REJECTED',
    isImageFilter: currentFilters.type === 'IMAGE',
    isVideoFilter: currentFilters.type === 'VIDEO'
  }), [currentFilters.status, currentFilters.type]);

  // 根据当前筛选状态判断可进行的批量操作
  const canBatchApprove = currentFilters.status === 'PENDING' && selectionState.hasSelection;
  const canBatchReject = currentFilters.status === 'PENDING' && selectionState.hasSelection;
  const canBatchWithdrawRejection = currentFilters.status === 'REJECTED' && selectionState.hasSelection;

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
        status: 'PENDING'
      });

      // 刷新数据
      refreshMediaList(false);
      refreshStats();
    } catch (error) {
      console.error('批量撤回拒绝失败:', error);
    }
  }, [selectedItems, canBatchWithdrawRejection, refreshMediaList, refreshStats]);

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
              onClick={() => handleStatusFilter('PENDING')}
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
      <MediaDetailModal
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
    </div>
  );
} 