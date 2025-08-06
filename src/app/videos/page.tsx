'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { VideoGrid } from './components/VideoGrid'
import { SearchBar } from './components/SearchBar'
import { CategoryTabs } from './components/CategoryTabs'
import { VideoUploadButton } from '@/components/VideoUploadButton'
import { useSearchParams } from 'next/navigation';
import { MediaItem, MediaFilters } from '@/services/media.service';
import {
  useInfiniteVideos,
  useUserTags,
  useUserCategories,
  useLikeImageMutation,
  useIncrementViewsMutation,
  userMediaQueryUtils
} from '@/hooks/queries/useUserMedia';
import { useIntersectionObserverLegacy } from '@/hooks/useIntersectionObserver';
import { queryClient } from '@/lib/query-client';
import { useToast } from '@/hooks/use-toast';

// URL规范化辅助函数
const normalizeUrl = (url: string | null | undefined, fallback: string = ''): string => {
  if (!url) return fallback;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  return `/${url}`;
};

export default function VideosPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // 本地UI状态
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MediaFilters>({
    type: 'VIDEO', // 只显示视频
    status: 'APPROVED', // 只显示已发布的视频
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // 无限滚动引用
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 从URL获取分类
  React.useEffect(() => {
    const category = searchParams.get('category');
    if (category && category !== 'all') {
      setFilters(prev => ({ ...prev, categoryId: category }));
    } else {
      setFilters(prev => ({ ...prev, categoryId: undefined }));
    }
  }, [searchParams]);

  // 构建API筛选参数
  const apiFilters: MediaFilters = useMemo(() => ({
    ...filters,
    search: searchQuery.trim() || undefined,
  }), [searchQuery, filters]);

  // 使用TanStack Query获取数据
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteVideos(apiFilters, 24);

  const { data: tags } = useUserTags();
  const { data: categories } = useUserCategories();

  // Mutation hooks
  const likeVideoMutation = useLikeImageMutation();
  const incrementViewsMutation = useIncrementViewsMutation();

  // 合并所有页面的视频数据
  const videos = useMemo(() => {
    return data?.pages.flatMap(page => page.data || []) || [];
  }, [data]);

  // 统计信息
  const totalCount = data?.pages[0]?.meta?.total || 0;

  // 处理错误
  React.useEffect(() => {
    if (isError && error) {
      console.error('加载视频数据失败:', error);
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '无法加载视频数据，请检查网络连接',
        variant: 'destructive'
      });
    }
  }, [isError, error, toast]);

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
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // TanStack Query 会自动重新获取数据
  }, []);

  // 分类切换处理
  const handleCategoryChange = useCallback((categoryId: string) => {
    const updatedFilters = {
      ...filters,
      categoryId: categoryId === 'all' ? undefined : categoryId,
    };
    console.log('分类筛选更新:', updatedFilters);
    setFilters(updatedFilters);
  }, [filters]);

  // 视频点击处理
  const handleVideoClick = useCallback((video: MediaItem) => {
    // 增加查看次数
    incrementViewsMutation.mutate(video.id);

    // TODO: 实现视频播放逻辑
    console.log('视频点击:', video);
  }, [incrementViewsMutation]);

  // 点赞处理
  const handleLike = useCallback((mediaId: string, isLiked: boolean) => {
    likeVideoMutation.mutate({ mediaId, isLiked });
  }, [likeVideoMutation]);

  // 上传完成处理
  const handleUploadComplete = useCallback(() => {
    // 刷新视频列表
    userMediaQueryUtils.invalidateVideos(queryClient);
    toast({
      title: '上传成功',
      description: '视频已成功上传并等待审核',
    });
  }, [toast]);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    refetch();
    userMediaQueryUtils.invalidateVideos(queryClient);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题和上传按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              精彩视频
            </h1>
            <p className="text-gray-600">
              欣赏精彩内容 • 共 {totalCount} 个视频
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white/50 transition-colors"
              title="刷新"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <VideoUploadButton onUploadComplete={handleUploadComplete} />
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* 分类标签 */}
        <div className="mb-8">
          <CategoryTabs
            categories={[
              { id: 'all', name: '全部' },
              ...(categories || [])
            ]}
          />
        </div>

        {/* 加载状态 */}
        {isLoading && videos.length === 0 && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-4 text-gray-600">加载视频中...</span>
          </div>
        )}

        {/* 视频网格 */}
        {!isLoading || videos.length > 0 ? (
          <div className="mb-8">
            <VideoGrid
              videos={videos.map(video => ({
                id: video.id,
                title: video.title,
                thumbnail: normalizeUrl(video.thumbnail_url, '/assets/zjy3.png'),
                duration: video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '00:00',
                views: video.views,
                publishedAt: video.created_at,
                author: {
                  id: video.user.uuid,
                  name: video.user.username,
                  avatar: normalizeUrl(video.user.avatar_url, '/assets/zjy3.png'),
                  followers: 0 // TODO: 添加粉丝数统计
                },
                videoUrl: normalizeUrl(video.url),
                recommendations: [], // TODO: 实现推荐逻辑
                likes: video.likes_count,
                commentsCount: 0, // TODO: 添加评论数统计
                isLiked: false, // TODO: 实现点赞状态
                isBookmarked: false, // TODO: 实现收藏状态
                source: 'USER_UPLOAD' as const,
                originalCreatedAt: video.original_created_at,
                sourceMetadata: video.source_metadata
              }))}
            />
          </div>
        ) : null}

        {/* 加载更多触发器 */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            )}
          </div>
        )}

        {/* 没有更多内容提示 */}
        {!hasNextPage && videos.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            已显示全部视频
          </div>
        )}
      </div>
    </div>
  );
}