'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Bookmark, Eye, Calendar, Search, Grid, List, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { InteractionService } from '@/services/interaction.service';
import LoadingSpinner from '@/components/LoadingSpinner';
import InteractionButtons from './InteractionButtons';
import { SimpleInteractionStats } from './InteractionStats';
import { ImageDetailModal } from '@/app/images/components/ImageDetailModal';
import { useLikeImageMutation, useFavoriteImageMutation } from '@/hooks/queries/useUserMedia';
import type {
  FavoriteItem,
  MyFavoritesProps,
  MediaInteractionStatus,
} from '@/types/interaction';
import type { MediaItem } from '@/services/media.service';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import VideoPlayerWrapper from '@/components/video/VideoPlayerWrapper';
import { buildVideoSources } from '@/lib/utils/video-sources';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type FavoritesFilterType = 'all' | 'IMAGE' | 'VIDEO';
type FavoritesSortKey = 'created_at' | 'likes' | 'views';

interface FavoriteApiMediaTag {
  tag?: {
    id: string;
    name: string;
  } | null;
}

type FavoriteApiItem = Omit<FavoriteItem, 'media'> & {
  media: FavoriteItem['media'] & {
    media_tags?: FavoriteApiMediaTag[] | null;
  };
};

// 图片URL规范化函数
const normalizeImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 如果已经是绝对路径，直接返回
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // 处理相对路径，特别是收藏API返回的 "uploads/image/xxx.jpg" 格式
  if (imageUrl.startsWith('uploads/')) {
    // 将 "uploads/image/xxx.jpg" 转换为 "http://localhost:3000/api/upload/file/image/xxx.jpg"
    const filename = imageUrl.split('/').pop(); // 提取文件名
    const mediaType = imageUrl.includes('/image/') ? 'image' : 'video';
    return `http://localhost:3000/api/upload/file/${mediaType}/${filename}`;
  }

  // 其他相对路径
  if (imageUrl.trim()) {
    return `/${imageUrl}`;
  }

  return '';
};

/**
 * 我的收藏页面组件
 */
export const MyFavorites: React.FC<MyFavoritesProps> = ({
  className,
  initialPage = 1,
  itemsPerPage = 20,
}) => {
  const { toast } = useToast();
  const router = useRouter();

  // 状态管理
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 筛选和排序
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FavoritesFilterType>('all');
  const [sortBy, setSortBy] = useState<FavoritesSortKey>('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 详情模态框状态
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<MediaItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [interactionStatuses, setInteractionStatuses] = useState<Record<string, MediaInteractionStatus>>({});

  // Mutation hooks for API calls
  const likeImageMutation = useLikeImageMutation();
  const favoriteImageMutation = useFavoriteImageMutation();

  /**
   * 加载收藏列表
   */
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await InteractionService.getMyFavorites({
        page: currentPage,
        limit: itemsPerPage,
      });

	      if (response.success && response.data && response.pagination) {
	        const apiFavorites = (response.data ?? []) as FavoriteApiItem[];
        const transformedFavorites: FavoriteItem[] = apiFavorites.map((favorite) => {
          const mediaTags = Array.isArray(favorite.media.tags) ? favorite.media.tags : [];
          const normalizedTags =
            mediaTags.length > 0
              ? mediaTags
              : favorite.media.media_tags
                  ?.map((mediaTag) => mediaTag?.tag)
                  .filter((tag): tag is { id: string; name: string } => Boolean(tag))
                  .map((tag) => ({
                    id: tag.id,
                    name: tag.name,
                  })) || [];

	          return {
	            id: favorite.id,
	            media: {
	              ...favorite.media,
	              tags: normalizedTags,
	              video_qualities: favorite.media.video_qualities || [],
	            },
	            created_at: favorite.created_at,
	          };
	        });

        setFavorites(transformedFavorites);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } else {
        throw new Error(response.message || '加载收藏列表失败');
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      setError(error instanceof Error ? error.message : '加载失败');
      toast({
        title: '加载失败',
        description: '无法加载收藏列表，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, toast]);

  // 初始化时加载收藏列表
  useEffect(() => {
    loadFavorites();
  }, [currentPage, loadFavorites]);

  // 筛选和搜索时重置页码并加载数据
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, sortBy, searchTerm]);

  /**
   * 加载互动状态
   */
  const loadInteractionStatuses = useCallback(async (mediaIds: string[]) => {
    try {
      if (mediaIds.length === 0) return;

      const [likeResponse, favoriteResponse] = await Promise.all([
        InteractionService.getBatchLikeStatus(mediaIds),
        InteractionService.getBatchFavoriteStatus(mediaIds)
      ]);

      if (likeResponse.success && favoriteResponse.success && likeResponse.data && favoriteResponse.data) {
        const likeStatuses = likeResponse.data.likes_status || {};
        const favoriteStatuses = favoriteResponse.data.favorites_status || {};

        const newStatuses: Record<string, MediaInteractionStatus> = {};

        mediaIds.forEach(mediaId => {
          newStatuses[mediaId] = {
            is_liked: likeStatuses[mediaId] || false,
            is_favorited: favoriteStatuses[mediaId] || false,
            likes_count: favorites.find(f => f.media.id === mediaId)?.media.likes_count || 0,
            favorites_count: favorites.find(f => f.media.id === mediaId)?.media.favorites_count || 0,
          };
        });

        setInteractionStatuses(newStatuses); // 直接设置而不是合并
      }
    } catch (error) {
      console.error('加载互动状态失败:', error);
    }
  }, [favorites]);

  // 收藏列表变化时加载互动状态
  useEffect(() => {
    if (favorites.length > 0) {
      const mediaIds = favorites.map(item => item.media.id);
      loadInteractionStatuses(mediaIds);
    }
  }, [favorites, loadInteractionStatuses]);

  /**
   * 处理互动状态变化
   */
  const handleInteractionChange = useCallback((mediaId: string, status: MediaInteractionStatus) => {
    // 如果取消收藏，从列表中移除
    if (!status.is_favorited) {
      setFavorites(prev => prev.filter(item => item.media.id !== mediaId));
      setTotal(prev => prev - 1);
      toast({
        title: '已取消收藏',
        description: '内容已从收藏夹中移除',
      });
    } else {
      // 更新列表中的统计数据
      setFavorites(prev =>
        prev.map(item =>
          item.media.id === mediaId
            ? {
              ...item,
              media: {
                ...item.media,
                likes_count: status.likes_count,
                favorites_count: status.favorites_count,
              },
            }
            : item
        )
      );
    }
  }, [toast]);

  /**
   * 创建稳定的回调映射，避免无限循环
   */
  const stableCallbacks = useMemo(() => {
    const callbacks: Record<string, (status: MediaInteractionStatus) => void> = {};
    favorites.forEach((item) => {
      callbacks[item.media.id] = (status: MediaInteractionStatus) => {
        handleInteractionChange(item.media.id, status);
      };
    });
    return callbacks;
  }, [favorites, handleInteractionChange]);

  /**
   * 处理分页
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const convertFavoriteMediaToMediaItem = useCallback(
    (media: FavoriteItem['media']): MediaItem => ({
      id: media.id,
      title: media.title,
      description: media.description || '',
      url:
        media.media_type === 'VIDEO'
          ? media.url
          : normalizeImageUrl(media.url),
      thumbnail_url: normalizeImageUrl(media.thumbnail_url || media.url),
      size: media.size,
      media_type: media.media_type,
      duration: media.duration,
      width: media.width,
      height: media.height,
      status: media.status,
      views: media.views,
      likes_count: media.likes_count,
      favorites_count: media.favorites_count,
      source: media.source,
      original_created_at: media.original_created_at,
      source_metadata: media.source_metadata,
      created_at: media.created_at,
      updated_at: media.updated_at,
      user: {
        id: media.user?.id || 0,
        uuid: media.user?.uuid || '',
        username: media.user?.username || '未知用户',
        avatar_url: media.user?.avatar_url || undefined,
      },
      tags: media.tags || [],
      category: media.category || null,
      video_qualities: media.video_qualities || [],
    }),
    [],
  );

  const handleMediaClick = useCallback(
    (item: FavoriteItem) => {
      if (item.media.media_type === 'VIDEO') {
        router.push(`/videos/${item.media.id}`);
        return;
      }
      const mediaItem = convertFavoriteMediaToMediaItem(item.media);
      setSelectedImage(mediaItem);
      setIsDetailModalOpen(true);
    },
    [convertFavoriteMediaToMediaItem, router],
  );

  const handlePreviewVideo = useCallback(
    (media: FavoriteItem['media']) => {
      const mediaItem = convertFavoriteMediaToMediaItem(media);
      setPreviewVideo(mediaItem);
      setIsPreviewOpen(true);
    },
    [convertFavoriteMediaToMediaItem],
  );

  /**
   * 关闭详情模态框
   */
  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
    setIsDetailModalOpen(false);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewVideo(null);
    setIsPreviewOpen(false);
  }, []);

  /**
   * 处理点赞
   */
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

  /**
   * 处理收藏
   */
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

    // 如果是取消收藏，从列表中移除
    if (isFavorited) {
      setFavorites(prev => prev.filter(item => item.media.id !== mediaId));
      setTotal(prev => prev - 1);
      handleCloseModal();

      toast({
        title: '取消收藏成功',
        description: '已从收藏中移除'
      });
    }
  }, [favoriteImageMutation, toast, handleCloseModal]);

  /**
   * 筛选收藏列表
   */
  const filteredFavorites = favorites
    .filter(item => {
      // 类型筛选
      if (filterType !== 'all' && item.media.media_type !== filterType) {
        return false;
      }
      // 搜索筛选
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.media.title.toLowerCase().includes(searchLower) ||
          item.media.description?.toLowerCase().includes(searchLower) ||
          item.media.tags.some(tag => tag.name.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'likes':
          return b.media.likes_count - a.media.likes_count;
        case 'views':
          return b.media.views - a.media.views;
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  /**
   * 渲染分页组件
   */
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </Button>
        {pages}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一页
        </Button>
      </div>
    );
  };

  /**
   * 渲染收藏项目
   */
  const renderFavoriteItem = (item: FavoriteItem) => {
    const { media } = item;
    const resolvedThumbnail = normalizeImageUrl(media.thumbnail_url || media.url) || '/placeholder-image.svg';

    if (viewMode === 'list') {
      return (
        <Card key={item.id} className="mb-4 rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* 媒体预览 */}
              <div className="flex-shrink-0">
                <div
                  className="relative w-32 h-24 bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => handleMediaClick(item)}
                >
                  <Image
                    src={resolvedThumbnail}
                    alt={media.title || '收藏内容'}
                    fill
                    className="object-cover transition-transform duration-200 hover:scale-105"
                    sizes="(max-width: 768px) 40vw, 128px"
                    loading="lazy"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.svg';
                    }}
                  />
                  {media.media_type === 'VIDEO' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 h-7 rounded-full bg-white/90 text-gray-800 shadow-sm hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewVideo(media);
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      预览
                    </Button>
                  )}
                </div>
              </div>

              {/* 内容信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate mb-2">{media.title}</h3>
                {media.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">{media.description}</p>
                )}

                {/* 标签 */}
                {media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {media.tags.slice(0, 3).map(tag => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                    {media.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{media.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* 统计信息 */}
                <div className="flex items-center justify-between">
                  <SimpleInteractionStats
                    likesCount={media.likes_count}
                    favoritesCount={media.favorites_count}
                    size="sm"
                  />
                  <div className="flex items-center text-xs text-gray-500">
                    <Eye className="h-3 w-3 mr-1" />
                    {media.views}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex-shrink-0 flex flex-col justify-between">
                <InteractionButtons
                  mediaId={media.id}
                  initialLikeStatus={{
                    is_liked: interactionStatuses[media.id]?.is_liked || false,
                    likes_count: interactionStatuses[media.id]?.likes_count || media.likes_count,
                  }}
                  initialFavoriteStatus={{
                    is_favorited: interactionStatuses[media.id]?.is_favorited !== undefined
                      ? interactionStatuses[media.id].is_favorited
                      : true, // 收藏页面默认都是已收藏
                    favorites_count: interactionStatuses[media.id]?.favorites_count || media.favorites_count,
                  }}
                  size="sm"
                  onInteractionChange={stableCallbacks[media.id]}
                />
                <div className="text-xs text-gray-500 mt-2">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 网格视图
    return (
      <Card key={item.id} className="overflow-hidden cursor-pointer rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm" onClick={() => handleMediaClick(item)}>
        <div className="relative aspect-square">
          <Image
            src={resolvedThumbnail}
            alt={media.title || '收藏内容'}
            fill
            className="object-cover transition-transform duration-200 hover:scale-105"
            sizes="(max-width: 1024px) 50vw, 320px"
            loading="lazy"
            unoptimized
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.svg';
            }}
          />
          {media.media_type === 'VIDEO' && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 h-7 rounded-full bg-white/90 text-gray-800 shadow-sm hover:bg-white z-10"
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewVideo(media);
              }}
            >
              <Play className="h-3 w-3 mr-1" />
              预览
            </Button>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {media.media_type === 'IMAGE' ? '图片' : '视频'}
            </Badge>
          </div>
        </div>

        <CardContent className="p-3">
          <h3 className="font-semibold truncate mb-2">{media.title}</h3>

          {/* 统计信息 */}
          <div className="flex items-center justify-between mb-3">
            <SimpleInteractionStats
              likesCount={media.likes_count}
              favoritesCount={media.favorites_count}
              size="sm"
            />
            <div className="flex items-center text-xs text-gray-500">
              <Eye className="h-3 w-3 mr-1" />
              {media.views}
            </div>
          </div>

          {/* 操作按钮 */}
          <div onClick={(e) => e.stopPropagation()}>
            <InteractionButtons
              mediaId={media.id}
              initialLikeStatus={{
                is_liked: interactionStatuses[media.id]?.is_liked || false,
                likes_count: interactionStatuses[media.id]?.likes_count || media.likes_count,
              }}
              initialFavoriteStatus={{
                is_favorited: interactionStatuses[media.id]?.is_favorited !== undefined
                  ? interactionStatuses[media.id].is_favorited
                  : true, // 收藏页面默认都是已收藏
                favorites_count: interactionStatuses[media.id]?.favorites_count || media.favorites_count,
              }}
              size="sm"
              showCounts={false}
              onInteractionChange={stableCallbacks[media.id]}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const previewSources = useMemo(() => {
    if (!previewVideo) return [];
    return buildVideoSources(previewVideo, { isAuthenticated: true });
  }, [previewVideo]);

  const previewPoster = previewVideo
    ? normalizeImageUrl(previewVideo.thumbnail_url || previewVideo.url)
    : undefined;

  return (
    <div className={cn('max-w-7xl mx-auto p-6', className)}>
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center text-gray-900">
          <Bookmark className="h-8 w-8 mr-3 text-amber-600" />
          我的收藏
        </h1>
        <p className="text-gray-600 mt-2 text-sm">
          总共收藏了 {total} 个内容
        </p>
      </div>

      {/* 筛选和搜索栏 */}
      <div className="bg-white/80 rounded-2xl border border-gray-200/60 shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索收藏的内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-full border-gray-200/60 bg-white/80 focus:border-[color:var(--theme-accent)]"
              />
            </div>
          </div>

          {/* 类型筛选 */}
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as FavoritesFilterType)}
          >
            <SelectTrigger className="w-32 rounded-full border-gray-200/60 bg-white/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="IMAGE">图片</SelectItem>
              <SelectItem value="VIDEO">视频</SelectItem>
            </SelectContent>
          </Select>

          {/* 排序 */}
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as FavoritesSortKey)}
          >
            <SelectTrigger className="w-32 rounded-full border-gray-200/60 bg-white/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">收藏时间</SelectItem>
              <SelectItem value="likes">点赞数</SelectItem>
              <SelectItem value="views">观看数</SelectItem>
            </SelectContent>
          </Select>

          {/* 视图模式 */}
          <div className="flex rounded-full border border-gray-200/60 bg-white/80 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid'
                ? 'rounded-full bg-[color:var(--theme-accent-soft)] text-gray-900'
                : 'rounded-full text-gray-500 hover:text-gray-700'}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list'
                ? 'rounded-full bg-[color:var(--theme-accent-soft)] text-gray-900'
                : 'rounded-full text-gray-500 hover:text-gray-700'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadFavorites}>重试</Button>
        </div>
      )}

      {!loading && !error && filteredFavorites.length === 0 && (
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无收藏内容</h3>
          <p className="text-gray-500">
            {searchTerm || filterType !== 'all'
              ? '没有找到符合条件的内容'
              : '开始收藏您喜欢的内容吧'
            }
          </p>
        </div>
      )}

      {!loading && !error && filteredFavorites.length > 0 && (
        <>
          {/* 收藏列表 */}
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
              : 'space-y-0'
          )}>
            {filteredFavorites.map(renderFavoriteItem)}
          </div>

          {/* 分页 */}
          {renderPagination()}
        </>
      )}

      {/* 图片详情模态框 */}
      <ImageDetailModal
        image={selectedImage}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
        onFavorite={handleFavorite}
        interactionStatus={selectedImage ? interactionStatuses[selectedImage.id] : undefined}
      />

      <Dialog
        open={isPreviewOpen && !!previewVideo}
        onOpenChange={(open) => {
          if (!open) {
            handleClosePreview();
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewVideo?.title || '视频预览'}</DialogTitle>
          </DialogHeader>
          {previewVideo && previewSources.length > 0 ? (
            <VideoPlayerWrapper
              src={previewSources}
              poster={previewPoster}
              controls
              enableQualitySelector={previewSources.length > 1}
              className="w-full"
            />
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              暂无可预览的视频源
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyFavorites;
