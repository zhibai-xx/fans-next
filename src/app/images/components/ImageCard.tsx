"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageItem } from '@/types/image';
import { HeartIcon, BookmarkIcon, DownloadIcon } from '@/components/icons/ActionIcons';
import { Button } from '@/components/ui/button';
import { InteractionService } from '@/services/interaction.service';
import type { MediaInteractionStatus } from '@/types/interaction';
import { useToast } from '@/hooks/use-toast';

interface ImageCardProps {
  image: ImageItem;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onInteractionChange?: (imageId: string, status: MediaInteractionStatus) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  priority = false,
  className = '',
  style,
  onInteractionChange
}) => {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  // 互动状态管理
  const [interactionStatus, setInteractionStatus] = useState<MediaInteractionStatus>({
    is_liked: image.isLiked || false,
    is_favorited: image.isBookmarked || false,
    likes_count: image.likes || 0,
    favorites_count: image.favorites || 0,
  });

  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // 初始化时获取真实的互动状态
  useEffect(() => {
    const loadInteractionStatus = async () => {
      try {
        const response = await InteractionService.getMediaInteractionStatus(image.id);
        if (response.success && response.data) {
          setInteractionStatus(response.data);
        }
      } catch (error) {
        console.error('获取互动状态失败:', error);
        // 如果获取失败，保持使用初始状态
      }
    };

    loadInteractionStatus();
  }, [image.id]);

  // 更新父组件状态
  useEffect(() => {
    if (onInteractionChange) {
      onInteractionChange(image.id, interactionStatus);
    }
  }, [interactionStatus, image.id, onInteractionChange]);

  /**
   * 处理点赞操作
   */
  const handleLike = async () => {
    if (isLikeLoading) return;

    setIsLikeLoading(true);
    const previousStatus = interactionStatus.is_liked;
    const previousCount = interactionStatus.likes_count;

    try {
      // 乐观更新UI
      setInteractionStatus(prev => ({
        ...prev,
        is_liked: !prev.is_liked,
        likes_count: prev.is_liked ? prev.likes_count - 1 : prev.likes_count + 1,
      }));

      // 调用API
      const response = await InteractionService.toggleLike(image.id, previousStatus);

      if (!response.success) {
        throw new Error(response.message || '操作失败');
      }

      toast({
        title: previousStatus ? '取消点赞成功' : '点赞成功',
        description: previousStatus ? '已取消点赞' : '感谢您的点赞！',
      });
    } catch (error) {
      console.error('点赞操作失败:', error);

      // 回滚UI状态
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
  const handleFavorite = async () => {
    if (isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    const previousStatus = interactionStatus.is_favorited;
    const previousCount = interactionStatus.favorites_count;

    try {
      // 乐观更新UI
      setInteractionStatus(prev => ({
        ...prev,
        is_favorited: !prev.is_favorited,
        favorites_count: prev.is_favorited ? prev.favorites_count - 1 : prev.favorites_count + 1,
      }));

      // 调用API
      const response = await InteractionService.toggleFavorite(image.id, previousStatus);

      if (!response.success) {
        throw new Error(response.message || '操作失败');
      }

      toast({
        title: previousStatus ? '取消收藏成功' : '收藏成功',
        description: previousStatus ? '已从收藏中移除' : '已添加到收藏夹',
      });
    } catch (error) {
      console.error('收藏操作失败:', error);

      // 回滚UI状态
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
  const handleDownload = async () => {
    try {
      // 创建一个临时链接来下载图片
      const link = document.createElement('a');
      link.href = image.url;
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

  return (
    <div
      className={`relative group rounded-lg overflow-hidden ${className}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0">
        <Image
          src={image.url}
          alt={image.title || '图片'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />
      </div>

      {/* 悬浮层 */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-transparent to-black/50 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {/* 顶部操作栏 */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <ActionButton
            icon={<BookmarkIcon />}
            onClick={handleFavorite}
            active={interactionStatus.is_favorited}
            count={interactionStatus.favorites_count}
            loading={isFavoriteLoading}
          />
          <ActionButton
            icon={<HeartIcon />}
            onClick={handleLike}
            active={interactionStatus.is_liked}
            count={interactionStatus.likes_count}
            loading={isLikeLoading}
          />
          <ActionButton
            icon={<DownloadIcon />}
            onClick={handleDownload}
          />
        </div>

        {/* 底部信息 */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-2">
          <Image
            src={image.author.avatar}
            alt={image.author.name}
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="text-white text-sm font-medium">
            {image.author.name}
          </span>
        </div>

        {/* 标签 */}
        {image.tags.length > 0 && (
          <div className="absolute bottom-4 right-4 flex flex-wrap gap-1">
            {image.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-black/30 rounded-full text-white text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  count?: number;
  loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  onClick,
  active = false,
  count,
  loading = false
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={loading}
    className={`p-2 h-auto w-auto rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors ${active
      ? 'text-red-500 hover:text-red-400'
      : 'text-white hover:text-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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