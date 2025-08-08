'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Heart, Bookmark, Download, Eye, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MediaItem } from '@/services/media.service';
import { InteractionService } from '@/services/interaction.service';
import type { MediaInteractionStatus } from '@/types/interaction';

// 头像URL规范化函数
const normalizeAvatarUrl = (avatarUrl?: string): string => {
  if (!avatarUrl || avatarUrl === 'default_avatar.png') {
    return '/assets/zjy3.png';
  }

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  if (avatarUrl.startsWith('/')) {
    return avatarUrl;
  }

  return `/${avatarUrl}`;
};

// 图片URL规范化函数
const normalizeImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  if (imageUrl.trim()) {
    return `/${imageUrl}`;
  }

  return '';
};

interface GridImageLayoutProps {
  images: MediaItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  onImageClick?: (image: MediaItem) => void;
  interactionStatuses?: Record<string, MediaInteractionStatus>;
  onInteractionChange?: (mediaId: string, newStatus: MediaInteractionStatus) => void;
}

interface GridImageCardProps {
  image: MediaItem;
  onClick?: () => void;
  priority?: boolean;
  interactionStatus?: MediaInteractionStatus;
  onInteractionChange?: (mediaId: string, newStatus: MediaInteractionStatus) => void;
}

// Grid图片卡片组件
const GridImageCard: React.FC<GridImageCardProps> = ({
  image,
  onClick,
  priority = false,
  interactionStatus: propInteractionStatus,
  onInteractionChange
}) => {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // 互动状态管理 - 使用传入的props，如果没有则使用默认值
  const [interactionStatus, setInteractionStatus] = useState<MediaInteractionStatus>(
    propInteractionStatus || {
      is_liked: false,
      is_favorited: false,
      likes_count: image.likes_count || 0,
      favorites_count: image.favorites_count || 0,
    }
  );

  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // 当外部传入的状态变化时更新本地状态
  useEffect(() => {
    if (propInteractionStatus) {
      setInteractionStatus(propInteractionStatus);
    }
  }, [propInteractionStatus]);

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  /**
   * 处理点赞操作
   */
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLikeLoading) return;

    setIsLikeLoading(true);
    const previousStatus = interactionStatus.is_liked;
    const previousCount = interactionStatus.likes_count;

    try {
      // 乐观更新UI
      const newStatus = {
        ...interactionStatus,
        is_liked: !previousStatus,
        likes_count: previousStatus ? interactionStatus.likes_count - 1 : interactionStatus.likes_count + 1,
      };

      setInteractionStatus(newStatus);

      const response = await InteractionService.toggleLike(image.id, previousStatus);

      if (!response.success) {
        throw new Error(response.message || '操作失败');
      }

      toast({
        title: previousStatus ? '取消点赞成功' : '点赞成功',
        description: previousStatus ? '已取消点赞' : '感谢您的点赞！',
      });

      // 通知父组件状态变化
      if (onInteractionChange) {
        onInteractionChange(image.id, newStatus);
      }
    } catch (error) {
      console.error('点赞操作失败:', error);

      setInteractionStatus(prev => ({
        ...prev,
        is_liked: previousStatus,
        likes_count: previousCount,
      }));

      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '点赞操作失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  /**
   * 处理收藏操作
   */
  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    const previousStatus = interactionStatus.is_favorited;
    const previousCount = interactionStatus.favorites_count;

    try {
      // 乐观更新UI
      const newStatus = {
        ...interactionStatus,
        is_favorited: !previousStatus,
        favorites_count: previousStatus ? interactionStatus.favorites_count - 1 : interactionStatus.favorites_count + 1,
      };

      setInteractionStatus(newStatus);

      const response = await InteractionService.toggleFavorite(image.id, previousStatus);

      if (!response.success) {
        throw new Error(response.message || '操作失败');
      }

      toast({
        title: previousStatus ? '取消收藏成功' : '收藏成功',
        description: previousStatus ? '已从收藏中移除' : '已添加到收藏夹',
      });

      // 通知父组件状态变化
      if (onInteractionChange) {
        onInteractionChange(image.id, newStatus);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);

      setInteractionStatus(prev => ({
        ...prev,
        is_favorited: previousStatus,
        favorites_count: previousCount,
      }));

      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '收藏操作失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  /**
   * 处理下载操作
   */
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = normalizeImageUrl(image.url);
      link.download = image.title || `image-${image.id}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '下载开始',
        description: '图片下载已开始',
      });
    } catch (error) {
      console.error('下载失败:', error);
      toast({
        title: '下载失败',
        description: '图片下载失败，请重试',
        variant: 'destructive',
      });
    }
  };

  // 格式化日期（当前未使用，但保留以备后用）
  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString('zh-CN', {
  //     month: 'short',
  //     day: 'numeric'
  //   });
  // };

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm aspect-square rounded-2xl"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 relative h-full">
        {/* 图片容器 */}
        <div className="relative overflow-hidden h-full">
          <div className="relative bg-gray-100 dark:bg-gray-700 h-full">
            {!imageFailed && (
              <Image
                src={normalizeImageUrl(image.thumbnail_url || image.url)}
                alt={image.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className={`object-cover transition-all duration-500 ${imageLoaded
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
                  } ${isHovered ? 'scale-105' : ''}`}
                priority={priority}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
              />
            )}

            {/* 加载状态 */}
            {!imageLoaded && !imageFailed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}

            {/* 失败状态 */}
            {imageFailed && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <div className="text-center text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-400 rounded" />
                  </div>
                  <div className="text-sm">加载失败</div>
                </div>
              </div>
            )}
          </div>

          {/* 悬浮遮罩和操作按钮 */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
            {/* 顶部操作按钮 */}
            <div className="absolute top-3 right-3 flex gap-2">
              <ActionButton
                icon={<Bookmark className={interactionStatus.is_favorited ? 'fill-current' : ''} />}
                tooltip={interactionStatus.is_favorited ? "取消收藏" : "收藏"}
                className={`bg-white/20 hover:bg-white/30 ${interactionStatus.is_favorited ? 'text-amber-500' : 'text-white'}`}
                onClick={handleFavorite}
                loading={isFavoriteLoading}
              />
              <ActionButton
                icon={<Heart className={interactionStatus.is_liked ? 'fill-current' : ''} />}
                tooltip={interactionStatus.is_liked ? "取消点赞" : "点赞"}
                className={`bg-white/20 hover:bg-white/30 ${interactionStatus.is_liked ? 'text-red-500' : 'text-white'}`}
                onClick={handleLike}
                loading={isLikeLoading}
              />
              <ActionButton
                icon={<Download />}
                tooltip="下载"
                className="bg-white/20 hover:bg-white/30"
                onClick={handleDownload}
              />
            </div>

            {/* 底部信息 */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="text-white text-sm">
                <h3 className="font-semibold mb-1 line-clamp-2 text-sm">
                  {image.title}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                      {image.user.avatar_url ? (
                        <Image
                          src={normalizeAvatarUrl(image.user.avatar_url)}
                          alt={image.user.username}
                          width={20}
                          height={20}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="w-2.5 h-2.5" />
                      )}
                    </div>
                    <span className="text-xs truncate">
                      {image.user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{formatNumber(image.views)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{formatNumber(interactionStatus.likes_count)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 操作按钮组件
interface ActionButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  className?: string;
  count?: number;
  onClick?: (e: React.MouseEvent) => void;
  loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  tooltip,
  className = '',
  count,
  onClick,
  loading = false
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 w-7 p-0 rounded-full backdrop-blur-sm transition-all duration-200 ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={tooltip}
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        if (!loading) {
          onClick?.(e);
        }
      }}
    >
      {loading ? (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        icon
      )}
      {count !== undefined && count > 0 && !loading && (
        <span className="ml-1 text-xs font-medium">
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </Button>
  );
};

// 主Grid布局组件
export const GridImageLayout: React.FC<GridImageLayoutProps> = ({
  images,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  onImageClick,
  interactionStatuses,
  onInteractionChange
}) => {
  const observerRef = useRef<HTMLDivElement>(null);

  // 无限滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  const handleImageClick = useCallback((image: MediaItem) => {
    onImageClick?.(image);
  }, [onImageClick]);

  return (
    <div className="w-full">
      {/* Grid容器 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.map((image, index) => (
          <GridImageCard
            key={image.id}
            image={image}
            onClick={() => handleImageClick(image)}
            priority={index < 12} // 前12张图片优先加载
            interactionStatus={interactionStatuses?.[image.id]}
            onInteractionChange={onInteractionChange}
          />
        ))}
      </div>

      {/* 加载更多触发器 */}
      <div ref={observerRef} className="w-full py-8">
        {isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {!hasMore && images.length > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-gray-500 shadow-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>已加载全部 {images.length} 张图片</span>
            </div>
          </div>
        )}

        {!isLoading && images.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex flex-col items-center gap-4 px-8 py-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-gray-600 font-medium mb-1">暂无图片</div>
                <div className="text-sm text-gray-400">试试调整搜索条件或上传新图片</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
