'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadButton } from '@/components/ImageUploadButton';
import { ImageSearchBar } from './components/ImageSearchBar';
import { MasonryImageGrid } from './components/MasonryImageGrid';
import { ImageDetailModal } from './components/ImageDetailModal';
import { MediaService, MediaItem, MediaTag, MediaCategory, MediaFilters } from '@/services/media.service';

export default function ImagesPage() {
    const { toast } = useToast();

    // 数据状态
    const [images, setImages] = useState<MediaItem[]>([]);
    const [categories, setCategories] = useState<MediaCategory[]>([]);
    const [tags, setTags] = useState<MediaTag[]>([]);

    // 分页和加载状态
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // 搜索和筛选状态
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<MediaFilters>({
        type: 'IMAGE', // 只显示图片
        status: 'APPROVED', // 只显示已发布的图片
        sortBy: 'created_at',
        sortOrder: 'desc'
    });

    // 布局模式
    const [layoutMode, setLayoutMode] = useState<'masonry' | 'grid'>('masonry');

    // 图片详情模态框状态
    const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);

    const PAGE_SIZE = 24;

    // 加载分类和标签数据
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [categoriesData, tagsData] = await Promise.all([
                    MediaService.getAllCategories(),
                    MediaService.getAllTags()
                ]);

                setCategories(categoriesData.categories);
                setTags(tagsData.tags);
            } catch (error) {
                console.error('加载分类和标签失败:', error);
                toast({
                    title: "错误",
                    description: "加载分类和标签失败",
                    variant: "destructive",
                });
            }
        };

        loadMetadata();
    }, [toast]);

    // 加载图片数据
    const loadImages = useCallback(async (
        isLoadMore = false,
        currentFilters = filters,
        currentSearchQuery = searchQuery
    ) => {
        if (loading) return;

        setLoading(true);
        try {
            const skip = isLoadMore ? images.length : 0;

            let result;

            // 根据搜索和筛选条件获取数据
            if (currentSearchQuery) {
                result = await MediaService.searchMedia({
                    query: currentSearchQuery,
                    skip,
                    take: PAGE_SIZE,
                    filters: currentFilters
                });
            } else if (currentFilters.categoryId) {
                result = await MediaService.getMediaByCategory(currentFilters.categoryId, {
                    skip,
                    take: PAGE_SIZE
                });
            } else if (currentFilters.tagId) {
                result = await MediaService.getMediaByTag(currentFilters.tagId, {
                    skip,
                    take: PAGE_SIZE
                });
            } else {
                result = await MediaService.getMediaList({
                    skip,
                    take: PAGE_SIZE,
                    filters: currentFilters
                });
            }

            // 处理数据
            const newImages = result.data;

            if (isLoadMore) {
                setImages(prev => [...prev, ...newImages]);
            } else {
                setImages(newImages);
                setPage(0);
            }

            setHasMore(result.meta.hasMore);
            setTotalCount(result.meta.total);

        } catch (error) {
            console.error('加载图片失败:', error);
            toast({
                title: "错误",
                description: "加载图片失败，请稍后重试",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [loading, images.length, filters, searchQuery, toast]);

    // 初始加载
    useEffect(() => {
        loadImages();
    }, []); // 只在组件挂载时加载一次

    // 搜索处理
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        loadImages(false, filters, query);
    }, [loadImages, filters]);

    // 筛选处理
    const handleFilterChange = useCallback((newFilters: MediaFilters) => {
        const updatedFilters = {
            ...newFilters,
            type: 'IMAGE' as const, // 强制只显示图片
            status: newFilters.status || 'APPROVED' as const, // 默认只显示已发布的
        };

        console.log('筛选条件更新:', updatedFilters);
        setFilters(updatedFilters);

        // 清空当前数据，重新加载
        setImages([]);
        setPage(0);
        setHasMore(true);

        // 延迟加载，避免状态更新冲突
        setTimeout(() => {
            loadImages(false, updatedFilters, searchQuery);
        }, 100);
    }, [searchQuery]);

    // 加载更多
    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            loadImages(true);
        }
    }, [loading, hasMore, loadImages]);

    // 图片点击处理
    const handleImageClick = useCallback((image: MediaItem) => {
        const index = images.findIndex(img => img.id === image.id);
        setSelectedImage(image);
        setSelectedImageIndex(index);
    }, [images]);

    // 模态框导航
    const handleNextImage = useCallback(() => {
        if (selectedImageIndex < images.length - 1) {
            const nextIndex = selectedImageIndex + 1;
            setSelectedImage(images[nextIndex]);
            setSelectedImageIndex(nextIndex);
        }
    }, [selectedImageIndex, images]);

    const handlePreviousImage = useCallback(() => {
        if (selectedImageIndex > 0) {
            const prevIndex = selectedImageIndex - 1;
            setSelectedImage(images[prevIndex]);
            setSelectedImageIndex(prevIndex);
        }
    }, [selectedImageIndex, images]);

    const handleCloseModal = useCallback(() => {
        setSelectedImage(null);
        setSelectedImageIndex(-1);
    }, []);

    // 上传完成处理
    const handleUploadComplete = useCallback((mediaIds: string[]) => {
        if (mediaIds.length > 0) {
            // 真正有文件上传成功
            toast({
                title: "成功",
                description: `成功上传 ${mediaIds.length} 张图片`,
            });
        } else {
            // 所有文件都已存在或者没有成功上传的文件
            toast({
                title: "提示",
                description: "所选文件已存在，未上传新文件",
                variant: "default"
            });
        }

        // 重新加载第一页数据
        loadImages(false, filters, searchQuery);
    }, [loadImages, filters, searchQuery, toast]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* 搜索筛选栏 */}
            <ImageSearchBar
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                categories={categories}
                tags={tags}
                currentFilters={filters}
                isLoading={loading}
                resultCount={totalCount}
                layoutMode={layoutMode}
                onLayoutChange={setLayoutMode}
            />

            {/* 主内容区域 */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* 页面头部 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            精美图片
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            发现和分享最美的瞬间 ✨
                        </p>
                    </div>

                    <ImageUploadButton onUploadComplete={handleUploadComplete} />
                </div>

                {/* 快速分类标签 */}
                {categories.length > 0 && !searchQuery && (
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleFilterChange({ ...filters, categoryId: undefined })}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!filters.categoryId
                                    ? 'bg-blue-500 text-white shadow-lg'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                    }`}
                            >
                                全部
                            </button>
                            {categories.slice(0, 6).map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => handleFilterChange({ ...filters, categoryId: category.id })}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filters.categoryId === category.id
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                        }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 空状态 */}
                {!loading && images.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <div className="text-4xl">🖼️</div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {searchQuery ? '未找到相关图片' : '暂无图片'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {searchQuery
                                ? `没有找到关于"${searchQuery}"的图片，试试其他关键词吧`
                                : '成为第一个分享美丽图片的人吧！'
                            }
                        </p>
                        {!searchQuery && (
                            <ImageUploadButton onUploadComplete={handleUploadComplete} />
                        )}
                    </div>
                )}

                {/* 图片展示区域 */}
                {images.length > 0 && (
                    <MasonryImageGrid
                        images={images}
                        onLoadMore={handleLoadMore}
                        hasMore={hasMore}
                        isLoading={loading}
                        onImageClick={handleImageClick}
                        gap={layoutMode === 'masonry' ? 16 : 12}
                    />
                )}
            </div>

            {/* 图片详情模态框 */}
            <ImageDetailModal
                image={selectedImage}
                isOpen={!!selectedImage}
                onClose={handleCloseModal}
                onNext={selectedImageIndex < images.length - 1 ? handleNextImage : undefined}
                onPrevious={selectedImageIndex > 0 ? handlePreviousImage : undefined}
            />

            {/* 回到顶部按钮 */}
            {images.length > 12 && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-30"
                    title="回到顶部"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            )}
        </div>
    );
}