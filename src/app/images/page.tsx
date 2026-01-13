'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadButton } from '@/components/ImageUploadButton';

import { ImageSearchBar } from './components/ImageSearchBar';
import { MasonryImageGrid } from './components/MasonryImageGrid';
import { GridImageLayout } from './components/GridImageLayout';
import { ImageDetailModal } from './components/ImageDetailModal';
import { MediaItem, MediaFilters } from '@/services/media.service';
import { InteractionService } from '@/services/interaction.service';
import type { MediaInteractionStatus } from '@/types/interaction';
import {
    useInfiniteImages,
    useUserTags,
    useUserCategories,
    useLikeImageMutation,
    useFavoriteImageMutation,
    useIncrementViewsMutation,
    userMediaQueryUtils
} from '@/hooks/queries/useUserMedia';
import { useIntersectionObserverLegacy } from '@/hooks/useIntersectionObserver';
import { queryClient } from '@/lib/query-client';
import { getViewSessionId } from '@/lib/view-session';

const SOURCE_GROUP_OPTIONS = [
    {
        key: 'official' as const,
        label: '官方精选',
        description: '系统导入 / 管理员精选内容',
    },
    {
        key: 'community' as const,
        label: '社区投稿',
        description: '粉丝用户上传作品',
    },
];

export default function ImagesPage() {
    const { toast } = useToast();

    // 本地UI状态
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<MediaFilters>({
        type: 'IMAGE', // 只显示图片
        status: 'APPROVED', // 只显示已发布的图片
        sortBy: 'created_at',
        sortOrder: 'desc',
        sourceGroup: 'official',
    });
    const [layoutMode, setLayoutMode] = useState<'masonry' | 'grid'>('masonry');
    const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);

    // 互动状态管理
    const [interactionStatuses, setInteractionStatuses] = useState<Record<string, MediaInteractionStatus>>({});

    // 无限滚动引用
    const loadMoreRef = useRef<HTMLDivElement>(null);

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
        error
    } = useInfiniteImages(apiFilters, 24);

    const { data: tags } = useUserTags();
    const { data: categories } = useUserCategories();

    // Mutation hooks
    const likeImageMutation = useLikeImageMutation();
    const favoriteImageMutation = useFavoriteImageMutation();
    const incrementViewsMutation = useIncrementViewsMutation();

    // 合并所有页面的图片数据
    const images = useMemo(() => {
        return data?.pages.flatMap(page => page.data || []) || [];
    }, [data]);

    // 批量获取互动状态
    useEffect(() => {
        const loadInteractionStatuses = async () => {
            if (images.length === 0) return;

            const mediaIds = images.map(image => image.id);

            try {
                const [likeResponse, favoriteResponse] = await Promise.all([
                    InteractionService.getBatchLikeStatus(mediaIds),
                    InteractionService.getBatchFavoriteStatus(mediaIds)
                ]);

                if (likeResponse.success && favoriteResponse.success && likeResponse.data && favoriteResponse.data) {
                    const likeStatuses = likeResponse.data.likes_status || {};
                    const favoriteStatuses = favoriteResponse.data.favorites_status || {};

                    const combined: Record<string, MediaInteractionStatus> = {};

                    for (const image of images) {
                        combined[image.id] = {
                            is_liked: likeStatuses[image.id] || false,
                            is_favorited: favoriteStatuses[image.id] || false,
                            likes_count: image.likes_count || 0,
                            favorites_count: image.favorites_count || 0,
                        };
                    }

                    setInteractionStatuses(combined);
                }
            } catch (error) {
                console.error('批量获取互动状态失败:', error);
                // 如果批量获取失败，设置默认状态
                const defaultStatuses: Record<string, MediaInteractionStatus> = {};
                for (const image of images) {
                    defaultStatuses[image.id] = {
                        is_liked: false,
                        is_favorited: false,
                        likes_count: image.likes_count || 0,
                        favorites_count: image.favorites_count || 0,
                    };
                }
                setInteractionStatuses(defaultStatuses);
            }
        };

        loadInteractionStatuses();
    }, [images]);

    // 处理互动状态更新的回调
    const handleInteractionChange = useCallback((mediaId: string, newStatus: MediaInteractionStatus) => {
        setInteractionStatuses(prev => ({
            ...prev,
            [mediaId]: newStatus
        }));
    }, []);

    // 统计信息
    const totalCount = data?.pages[0]?.pagination?.total || 0;
    const activeSourceGroup = filters.sourceGroup || 'official';

    // 处理错误
    React.useEffect(() => {
        if (isError && error) {
            console.error('加载图片数据失败:', error);
            toast({
                title: '加载失败',
                description: error instanceof Error ? error.message : '无法加载图片数据，请检查网络连接',
                variant: 'destructive'
            });
        }
    }, [isError, error, toast]);

    // 无限滚动监听
    useIntersectionObserverLegacy({
        target: loadMoreRef as React.RefObject<Element>,
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
        // TanStack Query 会自动重新获取数据，因为 queryKey 发生了变化
    }, []);

    // 筛选处理
    const handleFilterChange = useCallback((newFilters: MediaFilters) => {
        const updatedFilters = {
            ...newFilters,
            type: 'IMAGE' as const, // 强制只显示图片
            status: newFilters.status || 'APPROVED' as const, // 默认只显示已发布的
        };

        console.log('筛选条件更新:', updatedFilters);
        setFilters(updatedFilters);
        // TanStack Query 会自动重新获取数据
    }, []);
    const handleSourceGroupChange = useCallback((group: 'official' | 'community') => {
        setFilters(prev => {
            if (prev.sourceGroup === group) {
                return prev;
            }
            return {
                ...prev,
                sourceGroup: group,
            };
        });
    }, []);

    // 加载更多
    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const trackImageView = useCallback((mediaId: string) => {
        const sessionId = getViewSessionId();
        incrementViewsMutation.mutate({
            mediaId,
            mediaType: 'IMAGE',
            sessionId: sessionId ?? undefined,
            event: 'detail',
        });
    }, [incrementViewsMutation]);

    // 图片点击处理
    const handleImageClick = useCallback((image: MediaItem) => {
        const index = images.findIndex(img => img.id === image.id);
        setSelectedImage(image);
        setSelectedImageIndex(index);

        // 增加查看次数
        trackImageView(image.id);
    }, [images, trackImageView]);

    // 模态框导航
    const handleNextImage = useCallback(() => {
        if (selectedImageIndex < images.length - 1) {
            const nextIndex = selectedImageIndex + 1;
            const nextImage = images[nextIndex];
            setSelectedImage(nextImage);
            setSelectedImageIndex(nextIndex);
            // 增加查看次数
            trackImageView(nextImage.id);
        }
    }, [selectedImageIndex, images, trackImageView]);

    const handlePreviousImage = useCallback(() => {
        if (selectedImageIndex > 0) {
            const prevIndex = selectedImageIndex - 1;
            const prevImage = images[prevIndex];
            setSelectedImage(prevImage);
            setSelectedImageIndex(prevIndex);
            // 增加查看次数
            trackImageView(prevImage.id);
        }
    }, [selectedImageIndex, images, trackImageView]);

    // 点赞处理
    const handleLike = useCallback((mediaId: string, isLiked: boolean) => {
        likeImageMutation.mutate({ mediaId, isLiked });

        // 乐观更新本地状态
        setInteractionStatuses(prev => ({
            ...prev,
            [mediaId]: {
                ...prev[mediaId],
                is_liked: !isLiked,
                likes_count: isLiked ? (prev[mediaId]?.likes_count || 0) - 1 : (prev[mediaId]?.likes_count || 0) + 1,
            }
        }));
    }, [likeImageMutation]);

    // 收藏处理
    const handleFavorite = useCallback((mediaId: string, isFavorited: boolean) => {
        favoriteImageMutation.mutate({ mediaId, isFavorited });

        // 乐观更新本地状态
        setInteractionStatuses(prev => ({
            ...prev,
            [mediaId]: {
                ...prev[mediaId],
                is_favorited: !isFavorited,
                favorites_count: isFavorited ? (prev[mediaId]?.favorites_count || 0) - 1 : (prev[mediaId]?.favorites_count || 0) + 1,
            }
        }));
    }, [favoriteImageMutation]);

    // 上传完成处理
    const handleUploadComplete = useCallback((mediaIds: string[]) => {
        if (mediaIds.length === 0) {
            toast({
                title: '无需上传',
                description: '图片已存在，无需重复上传',
            });
            return;
        }

        // 刷新图片列表
        userMediaQueryUtils.invalidateImages(queryClient);
        toast({
            title: '上传成功',
            description: '图片已成功上传并等待审核',
        });
    }, [toast]);



    return (
        <div className="min-h-screen bg-gray-50/30">
            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* 顶部工具栏 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>{totalCount} 张图片</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ImageUploadButton onUploadComplete={handleUploadComplete} />
                    </div>
                </div>

                {/* 来源切换 */}
                <div className="mb-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">展示来源</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    默认展示官方精选，可切换为社区投稿并继续搭配分类/标签筛选
                                </p>
                            </div>
                            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {activeSourceGroup === 'official' ? '官方精选' : '社区投稿'}
                            </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {SOURCE_GROUP_OPTIONS.map((option) => {
                                const isActive = activeSourceGroup === option.key;
                                return (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => handleSourceGroupChange(option.key)}
                                        className={[
                                            'rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300',
                                            isActive
                                                ? 'border-pink-200 bg-pink-50 shadow-sm dark:border-pink-500/40 dark:bg-pink-500/10'
                                                : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50/40 dark:border-gray-700 dark:hover:border-pink-500/30',
                                        ].join(' ')}
                                    >
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{option.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 搜索和筛选栏 */}
                <div className="mb-6">
                    <ImageSearchBar
                        onSearch={handleSearch}
                        onFilterChange={handleFilterChange}
                        categories={categories || []}
                        tags={tags || []}
                        currentFilters={filters}
                        isLoading={isLoading}
                        resultCount={totalCount}
                        layoutMode={layoutMode}
                        onLayoutChange={setLayoutMode}
                    />
                </div>

                {/* 图片网格 - 根据布局模式渲染不同组件 */}
                <div className="mb-8">
                    {layoutMode === 'masonry' ? (
                        <MasonryImageGrid
                            images={images}
                            isLoading={isLoading}
                            hasMore={hasNextPage}
                            onLoadMore={handleLoadMore}
                            onImageClick={handleImageClick}
                            interactionStatuses={interactionStatuses}
                            onInteractionChange={handleInteractionChange}
                        />
                    ) : (
                        <GridImageLayout
                            images={images}
                            isLoading={isLoading}
                            hasMore={hasNextPage}
                            onLoadMore={handleLoadMore}
                            onImageClick={handleImageClick}
                            interactionStatuses={interactionStatuses}
                            onInteractionChange={handleInteractionChange}
                        />
                    )}
                </div>

                {/* 加载更多触发器 */}
                {hasNextPage && (
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                        {isFetchingNextPage && (
                            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-500"></div>
                                <span className="text-sm text-gray-600">加载更多图片</span>
                            </div>
                        )}
                    </div>
                )}

                {/* 图片详情模态框 */}
                <ImageDetailModal
                    image={selectedImage}
                    isOpen={!!selectedImage}
                    onClose={() => {
                        setSelectedImage(null);
                        setSelectedImageIndex(-1);
                    }}
                    onNext={handleNextImage}
                    onPrevious={handlePreviousImage}
                    onLike={handleLike}
                    onFavorite={handleFavorite}
                    interactionStatus={selectedImage ? interactionStatuses[selectedImage.id] : undefined}
                    canGoNext={selectedImageIndex < images.length - 1}
                    canGoPrevious={selectedImageIndex > 0}
                />
            </div>
        </div>
    );
}
