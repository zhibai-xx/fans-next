'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ModernVideoGrid } from './components/ModernVideoGrid';
import { SearchBar } from './components/SearchBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoUploadButton } from '@/components/VideoUploadButton';

import {
  useInfiniteVideos,
  useTrendingVideos,
  useLatestVideos,
} from '@/hooks/useVideos';
import { VideoFilters } from '@/services/video.service';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  TrendingUp,
  Clock,
  Upload,
  Filter,
  Grid,
  List
} from 'lucide-react';



export default function ModernVideosPage() {
  const { toast } = useToast();

  // 本地状态
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'latest'>('all');

  // 无限滚动引用
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 构建筛选条件
  const filters: VideoFilters = useMemo(() => ({
    search: searchQuery || undefined,
    status: 'APPROVED',
    sortBy: activeTab === 'trending' ? 'views' : 'created_at',
    sortOrder: 'desc',
  }), [searchQuery, activeTab]);

  // 主要的视频查询
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteVideos(filters);

  // 热门和最新视频查询（用于推荐）
  const { data: trendingData } = useTrendingVideos(8);
  const { data: latestData } = useLatestVideos(8);

  // 合并所有页面的视频数据
  const videos = useMemo(() => {
    if (activeTab === 'trending' && trendingData?.data) {
      return trendingData.data;
    }
    if (activeTab === 'latest' && latestData?.data) {
      return latestData.data;
    }
    return data?.pages.flatMap(page => page.data || []) || [];
  }, [data, trendingData, latestData, activeTab]);

  // 统计信息
  const totalCount = data?.pages[0]?.pagination?.total || 0;

  // 错误处理
  React.useEffect(() => {
    if (isError && error) {
      console.error('加载视频数据失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载视频数据，请检查网络连接',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [isError, error, toast]);

  // 无限滚动监听
  useIntersectionObserver(loadMoreRef, {
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage && activeTab === 'all') {
        fetchNextPage();
      }
    },
    threshold: 0.1,
    rootMargin: '100px',
  });

  // 搜索处理
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setActiveTab('all'); // 搜索时切回全部标签
  }, []);

  // 标签切换处理
  const handleTabChange = useCallback((tab: 'all' | 'trending' | 'latest') => {
    setActiveTab(tab);
    setSearchQuery(''); // 清除搜索
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* 页面头部 */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center">
              <Grid className="w-4 h-4 mr-1" />
              {totalCount.toLocaleString()} 个视频
            </span>
            {activeTab !== 'all' && (
              <span className="rounded-full border border-[color:var(--theme-accent)] bg-[color:var(--theme-accent-soft)] px-3 py-1 text-xs font-medium text-gray-700">
                {activeTab === 'trending' ? '热门推荐' : '最新发布'}
              </span>
            )}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-3">
            {/* 视图切换 */}
            <div className="flex items-center rounded-full border border-gray-200/60 bg-white/80 p-1 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid'
                  ? 'rounded-full bg-[color:var(--theme-accent-soft)] text-gray-900'
                  : 'rounded-full text-gray-500 hover:text-gray-700'}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list'
                  ? 'rounded-full bg-[color:var(--theme-accent-soft)] text-gray-900'
                  : 'rounded-full text-gray-500 hover:text-gray-700'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* 上传按钮 */}
            <VideoUploadButton
              onUploadComplete={(mediaIds) => {
                if (mediaIds.length === 0) {
                  toast({
                    title: '无需上传',
                    description: '视频已存在，无需重复上传',
                  });
                  return;
                }
                toast({
                  title: '上传成功',
                  description: `已成功上传 ${mediaIds.length} 个视频`,
                });
                // 刷新视频列表
                refetch();
              }}
            />
          </div>
        </div>

        {/* 筛选与搜索 */}
        <div className="mb-6">
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange('all')}
                className={activeTab === 'all'
                  ? 'rounded-full border border-[color:var(--theme-accent)] bg-[color:var(--theme-accent-soft)] text-gray-900'
                  : 'rounded-full text-gray-600 hover:bg-gray-50'}
              >
                <Grid className="w-4 h-4 mr-2" />
                全部
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange('trending')}
                className={activeTab === 'trending'
                  ? 'rounded-full border border-[color:var(--theme-accent)] bg-[color:var(--theme-accent-soft)] text-gray-900'
                  : 'rounded-full text-gray-600 hover:bg-gray-50'}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                热门
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange('latest')}
                className={activeTab === 'latest'
                  ? 'rounded-full border border-[color:var(--theme-accent)] bg-[color:var(--theme-accent-soft)] text-gray-900'
                  : 'rounded-full text-gray-600 hover:bg-gray-50'}
              >
                <Clock className="w-4 h-4 mr-2" />
                最新
              </Button>
            </div>
            <div className="mt-4">
              <SearchBar
                onSearch={handleSearch}
                placeholder="搜索您感兴趣的视频内容..."
              />
            </div>
          </div>
        </div>

        {/* 当前筛选条件显示 */}
        {searchQuery && (
          <div className="flex items-center space-x-2 mb-6">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">当前筛选:</span>
            <Badge variant="outline" className="bg-white/80 border-gray-200/60">
              搜索: {searchQuery}
            </Badge>
          </div>
        )}

        {/* 视频网格 */}
        <div className="mb-8">
          <ModernVideoGrid
            videos={videos}
            isLoading={isLoading && videos.length === 0}
          />
        </div>

        {/* 加载更多触发器 */}
        {hasNextPage && activeTab === 'all' && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>加载更多...</span>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                className="bg-white/80 backdrop-blur-sm"
              >
                点击加载更多
              </Button>
            )}
          </div>
        )}

        {/* 没有更多内容提示 */}
        {!hasNextPage && videos.length > 0 && activeTab === 'all' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-gray-500">
              <span>已显示全部视频内容</span>
            </div>
          </div>
        )}

        {/* 空状态提示 */}
        {!isLoading && videos.length === 0 && (
          <Card className="rounded-2xl border border-gray-200/60 bg-white/80 p-12 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? '没有找到相关视频' : '暂无视频内容'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? '试试其他关键词或调整筛选条件'
                : '还没有任何视频内容，快来上传第一个视频吧！'
              }
            </p>
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                清除搜索条件
              </Button>
            ) : (
              <Button className="gap-2">
                <Upload className="w-4 h-4 mr-2" />
                上传第一个视频
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
