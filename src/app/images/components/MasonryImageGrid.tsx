'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Heart, Bookmark, Download, Eye, Calendar, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MediaItem } from '@/services/media.service';

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

interface MasonryImageGridProps {
  images: MediaItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  onImageClick?: (image: MediaItem) => void;
  columns?: number;
  gap?: number;
}

interface ImageCardProps {
  image: MediaItem;
  onClick?: () => void;
  priority?: boolean;
}

// 优化的图片卡片组件
const OptimizedImageCard: React.FC<ImageCardProps> = ({
  image,
  onClick,
  priority = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden border-0 bg-white dark:bg-gray-800 break-inside-avoid mb-4"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 relative">
        {/* 图片容器 */}
        <div className="relative overflow-hidden rounded-t-lg">
          <div className="relative bg-gray-100 dark:bg-gray-700">
            {!imageFailed && (
              <Image
                src={normalizeImageUrl(image.thumbnail_url || image.url)}
                alt={image.title}
                width={image.width || 400}
                height={image.height || 600}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className={`w-full h-auto transition-all duration-500 ${imageLoaded
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
                  } ${isHovered ? 'scale-105' : ''}`}
                priority={priority}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            )}

            {/* 加载状态 */}
            {!imageLoaded && !imageFailed && (
              <div className="absolute inset-0 flex items-center justify-center min-h-[200px]">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}

            {/* 失败状态 */}
            {imageFailed && (
              <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 min-h-[200px]">
                <div className="text-center text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-400 rounded" />
                  </div>
                  <div className="text-sm">图片加载失败</div>
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
                icon={<Bookmark />}
                tooltip="收藏"
                className="bg-white/20 hover:bg-white/30"
              />
              <ActionButton
                icon={<Heart />}
                tooltip="点赞"
                className="bg-white/20 hover:bg-white/30"
                count={image.likes_count}
              />
              <ActionButton
                icon={<Download />}
                tooltip="下载"
                className="bg-white/20 hover:bg-white/30"
              />
            </div>

            {/* 底部信息 */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 text-white text-sm">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                  {image.user.avatar_url ? (
                    <Image
                      src={normalizeAvatarUrl(image.user.avatar_url)}
                      alt={image.user.username}
                      width={24}
                      height={24}
                      className="object-cover w-auto h-auto"
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                </div>
                <span className="truncate font-medium">
                  {image.user.username}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 卡片底部信息 */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
            {image.title}
          </h3>

          {/* 标签 */}
          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {image.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs px-2 py-1">
                  {tag.name}
                </Badge>
              ))}
              {image.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{image.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 统计信息 */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(image.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{formatNumber(image.likes_count)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(image.created_at)}</span>
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
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  tooltip,
  className = '',
  count,
  onClick
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 rounded-full backdrop-blur-sm ${className}`}
      title={tooltip}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {icon}
      {count !== undefined && count > 0 && (
        <span className="ml-1 text-xs">{count}</span>
      )}
    </Button>
  );
};

// 主瀑布流组件
export const MasonryImageGrid: React.FC<MasonryImageGridProps> = ({
  images,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  onImageClick,
  columns: fixedColumns,
  gap = 16
}) => {
  const observerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);

  // 响应式列数计算
  const calculateColumns = useCallback(() => {
    if (fixedColumns) {
      setColumns(fixedColumns);
      return;
    }

    const width = window.innerWidth;
    if (width >= 1536) setColumns(6);       // 2xl
    else if (width >= 1280) setColumns(5);  // xl
    else if (width >= 1024) setColumns(4);  // lg
    else if (width >= 768) setColumns(3);   // md
    else if (width >= 640) setColumns(2);   // sm
    else setColumns(1);                     // base
  }, [fixedColumns]);

  // 监听窗口大小变化
  useEffect(() => {
    calculateColumns();

    const handleResize = () => calculateColumns();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateColumns]);

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
      {/* CSS Column 瀑布流容器 */}
      <div
        className="w-full"
        style={{
          columnCount: columns,
          columnGap: `${gap}px`,
          columnFill: 'balance'
        }}
      >
        {images.map((image, index) => (
          <OptimizedImageCard
            key={image.id}
            image={image}
            onClick={() => handleImageClick(image)}
            priority={index < 6} // 前6张图片优先加载
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
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-sm">已加载全部图片 ({images.length} 张)</div>
          </div>
        )}
      </div>
    </div>
  );
}; 