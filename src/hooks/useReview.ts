import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  ReviewStats,
  ReviewFilters,
  BatchUpdateStatusData,
  BatchUpdateTagsData,
  BatchUpdateCategoryData
} from '@/types/review';
import { MediaItem } from '@/services/media.service';
import { ReviewService, UseReviewResult } from '@/services/review.service';

export function useReview(initialFilters: ReviewFilters = {}): UseReviewResult {
  const { toast } = useToast();

  // 确保每次重新挂载时都使用正确的初始筛选条件
  const [currentFilters, setCurrentFilters] = useState<ReviewFilters>(() => ({
    status: initialFilters.status || 'PENDING',
    take: initialFilters.take || 20,
    sortBy: initialFilters.sortBy || 'created_at',
    sortOrder: initialFilters.sortOrder || 'desc',
    skip: 0,
    ...initialFilters
  }));

  const [stats, setStats] = useState<ReviewStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    private: 0,
    images: 0,
    videos: 0,
    todayPending: 0,
    todayReviewed: 0,
    total: 0
  });
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<Map<string, boolean>>(new Map());

  // 使用ref保存最新的筛选条件，避免闭包陷阱
  const currentFiltersRef = useRef(currentFilters);
  currentFiltersRef.current = currentFilters;

  // 使用ref作为请求锁
  const requestLockRef = useRef<string | null>(null);

  // 刷新统计数据
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await ReviewService.getStats();
      setStats(newStats);
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  }, []);

  // 获取媒体列表
  const refreshMediaList = useCallback(async (append = false): Promise<void> => {
    const requestId = `${Date.now()}-${Math.random()}`;

    // 检查是否已有请求在进行
    if (requestLockRef.current) {
      return Promise.resolve();
    }

    // 加锁
    requestLockRef.current = requestId;

    if (isLoading) {
      requestLockRef.current = null;
      return Promise.resolve();
    }

    setIsLoading(true);
    setError(null);

    try {
      const filters = currentFiltersRef.current;
      const response = await ReviewService.getMediaList(filters);

      // 再次检查锁状态，确保当前请求仍然有效
      if (requestLockRef.current !== requestId) {
        return;
      }

      if (append) {
        setMediaList(prev => [...prev, ...response.data]);
      } else {
        setMediaList(response.data);
        setSelectedMap(new Map());
      }

      setHasMore(response.meta.hasMore);
      setTotal(response.meta.total);

      // 智能页面检查：如果当前页面没有数据且不是第一页，自动跳转到第一页
      if (!append && response.data.length === 0 && filters.skip && filters.skip > 0) {
        setCurrentFilters(prev => ({ ...prev, skip: 0 }));
        setTimeout(() => {
          refreshMediaList(false);
        }, 100);
        return;
      }
    } catch (err: any) {
      console.error('获取媒体列表失败:', err);
      if (err.message?.includes('未授权')) {
        setError('权限不足，请确保您有管理员权限');
      } else {
        setError('获取媒体列表失败');
        toast({
          title: '错误',
          description: '获取媒体列表失败',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
      requestLockRef.current = null;
    }
  }, [toast]);

  // 使用ref防止重复调用
  const isUpdatingRef = useRef(false);

  // 更新筛选条件
  const updateFilters = useCallback((newFilters: Partial<ReviewFilters>) => {
    // 防止重复调用
    if (isUpdatingRef.current) {
      return;
    }

    setCurrentFilters(prevFilters => {
      const updatedFilters = {
        ...prevFilters,
        ...newFilters,
        skip: newFilters.skip !== undefined ? newFilters.skip : 0
      };

      const hasChanged = JSON.stringify(prevFilters) !== JSON.stringify(updatedFilters);

      if (hasChanged) {
        isUpdatingRef.current = true;
        requestAnimationFrame(() => {
          refreshMediaList(false).finally(() => {
            isUpdatingRef.current = false;
          });
        });
      }

      return updatedFilters;
    });
  }, [refreshMediaList]);

  // 批量操作后的智能刷新
  const smartRefresh = useCallback(async () => {
    await refreshStats();
    await refreshMediaList(false);
  }, [refreshStats, refreshMediaList]);

  // 选择相关逻辑
  const selectedItems = useMemo(() => {
    const selected = new Set<string>();
    selectedMap.forEach((isSelected, id) => {
      if (isSelected) selected.add(id);
    });
    return selected;
  }, [selectedMap]);

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedMap(prev => {
      const newMap = new Map(prev);
      newMap.set(id, !prev.get(id));
      return newMap;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMap(new Map());
  }, []);

  // 批量操作
  const batchApprove = useCallback(async () => {
    const itemsToApprove = Array.from(selectedItems);
    if (itemsToApprove.length === 0) return;

    try {
      await ReviewService.batchUpdateStatus({
        mediaIds: itemsToApprove,
        status: 'APPROVED'
      });
      toast({
        title: '成功',
        description: `已批量通过 ${itemsToApprove.length} 项`,
      });
      await smartRefresh();
    } catch (error) {
      console.error('批量通过失败:', error);
      toast({
        title: '错误',
        description: '批量操作失败',
        variant: 'destructive'
      });
    }
  }, [selectedItems, smartRefresh, toast]);

  const batchReject = useCallback(async () => {
    const itemsToReject = Array.from(selectedItems);
    if (itemsToReject.length === 0) return;

    try {
      await ReviewService.batchUpdateStatus({
        mediaIds: itemsToReject,
        status: 'REJECTED'
      });
      toast({
        title: '成功',
        description: `已批量拒绝 ${itemsToReject.length} 项`,
      });
      await smartRefresh();
    } catch (error) {
      console.error('批量拒绝失败:', error);
      toast({
        title: '错误',
        description: '批量操作失败',
        variant: 'destructive'
      });
    }
  }, [selectedItems, smartRefresh, toast]);

  // 单项操作
  const approveItem = useCallback(async (id: string) => {
    try {
      await ReviewService.updateSingleStatus(id, 'APPROVED');
      toast({
        title: '成功',
        description: '已通过',
      });
      await smartRefresh();
    } catch (error) {
      console.error('通过失败:', error);
      toast({
        title: '错误',
        description: '操作失败',
        variant: 'destructive'
      });
    }
  }, [smartRefresh, toast]);

  const rejectItem = useCallback(async (id: string) => {
    try {
      await ReviewService.updateSingleStatus(id, 'REJECTED');
      toast({
        title: '成功',
        description: '已拒绝',
      });
      await smartRefresh();
    } catch (error) {
      console.error('拒绝失败:', error);
      toast({
        title: '错误',
        description: '操作失败',
        variant: 'destructive'
      });
    }
  }, [smartRefresh, toast]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await refreshMediaList(true);
    }
  }, [isLoading, hasMore, refreshMediaList]);

  // 初始化加载
  useEffect(() => {
    refreshStats();
    refreshMediaList(false);

    // 定期刷新统计数据
    const interval = setInterval(refreshStats, 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshStats, refreshMediaList]);

  return {
    // 状态
    currentFilters,
    stats,
    mediaList,
    total,
    hasMore,
    isLoading,
    error,
    selectedItems,
    selectionState: {
      hasSelection: selectedItems.size > 0,
      selectedCount: selectedItems.size,
      totalCount: mediaList.length,
      isAllSelected: selectedItems.size === mediaList.length && mediaList.length > 0,
      isPartialSelected: selectedItems.size > 0 && selectedItems.size < mediaList.length
    },

    // 操作函数
    updateFilters,
    refreshStats,
    refreshMediaList,
    loadMore,

    // 选择操作
    toggleSelection: toggleItemSelection,
    selectAll: () => {
      setSelectedMap(() => {
        const newMap = new Map<string, boolean>();
        mediaList.forEach(item => {
          newMap.set(item.id, true);
        });
        return newMap;
      });
    },
    clearSelection,

    // 审核操作
    batchApprove,
    batchReject,
    approveItem,
    rejectItem,
    batchSetTags: async () => { },
    batchSetCategory: async () => { },
    isSelected: (mediaId: string) => selectedMap.get(mediaId) || false
  };
} 