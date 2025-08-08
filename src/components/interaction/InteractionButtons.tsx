'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { InteractionService } from '@/services/interaction.service';
import type {
  MediaInteractionStatus,
  InteractionButtonsProps,
  LikeStatus,
  FavoriteStatus,
} from '@/types/interaction';
import { cn } from '@/lib/utils';

/**
 * 媒体互动按钮组件
 * 包含点赞和收藏功能
 */
export const InteractionButtons: React.FC<InteractionButtonsProps> = ({
  mediaId,
  initialLikeStatus,
  initialFavoriteStatus,
  className,
  size = 'md',
  showCounts = true,
  onInteractionChange,
}) => {
  const { toast } = useToast();

  // 状态管理
  const [likeStatus, setLikeStatus] = useState<LikeStatus>({
    is_liked: initialLikeStatus?.is_liked || false,
    likes_count: initialLikeStatus?.likes_count || 0,
  });

  const [favoriteStatus, setFavoriteStatus] = useState<FavoriteStatus>({
    is_favorited: initialFavoriteStatus?.is_favorited || false,
    favorites_count: initialFavoriteStatus?.favorites_count || 0,
  });

  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // 初始化时获取互动状态
  useEffect(() => {
    if (!initialLikeStatus || !initialFavoriteStatus) {
      loadInteractionStatus();
    }
  }, [mediaId]);

  // 监听props变化并更新状态
  useEffect(() => {
    if (initialLikeStatus) {
      setLikeStatus({
        is_liked: initialLikeStatus.is_liked,
        likes_count: initialLikeStatus.likes_count,
      });
    }
  }, [initialLikeStatus?.is_liked, initialLikeStatus?.likes_count]);

  useEffect(() => {
    if (initialFavoriteStatus) {
      setFavoriteStatus({
        is_favorited: initialFavoriteStatus.is_favorited,
        favorites_count: initialFavoriteStatus.favorites_count,
      });
    }
  }, [initialFavoriteStatus?.is_favorited, initialFavoriteStatus?.favorites_count]);

  // 通知父组件状态变化
  useEffect(() => {
    if (onInteractionChange) {
      onInteractionChange({
        is_liked: likeStatus.is_liked,
        is_favorited: favoriteStatus.is_favorited,
        likes_count: likeStatus.likes_count,
        favorites_count: favoriteStatus.favorites_count,
      });
    }
  }, [likeStatus, favoriteStatus, onInteractionChange]);

  /**
   * 加载互动状态
   */
  const loadInteractionStatus = async () => {
    try {
      const response = await InteractionService.getMediaInteractionStatus(mediaId);
      if (response.success && response.data) {
        setLikeStatus({
          is_liked: response.data.is_liked,
          likes_count: response.data.likes_count,
        });
        setFavoriteStatus({
          is_favorited: response.data.is_favorited,
          favorites_count: response.data.favorites_count,
        });
      }
    } catch (error) {
      console.error('加载互动状态失败:', error);
    }
  };

  /**
   * 处理点赞操作
   */
  const handleLike = async () => {
    if (isLikeLoading) return;

    setIsLikeLoading(true);
    const previousStatus = likeStatus.is_liked;
    const previousCount = likeStatus.likes_count;

    try {
      // 乐观更新UI
      setLikeStatus(prev => ({
        is_liked: !prev.is_liked,
        likes_count: prev.is_liked ? prev.likes_count - 1 : prev.likes_count + 1,
      }));

      // 调用API
      const response = await InteractionService.toggleLike(mediaId, previousStatus);

      if (response.success) {
        toast({
          title: previousStatus ? '取消点赞成功' : '点赞成功',
          description: previousStatus ? '已取消点赞' : '感谢您的点赞！',
        });
      } else {
        throw new Error(response.message || '操作失败');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);

      // 回滚UI状态
      setLikeStatus({
        is_liked: previousStatus,
        likes_count: previousCount,
      });

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
    const previousStatus = favoriteStatus.is_favorited;
    const previousCount = favoriteStatus.favorites_count;

    try {
      // 乐观更新UI
      setFavoriteStatus(prev => ({
        is_favorited: !prev.is_favorited,
        favorites_count: prev.is_favorited ? prev.favorites_count - 1 : prev.favorites_count + 1,
      }));

      // 调用API
      const response = await InteractionService.toggleFavorite(mediaId, previousStatus);

      if (response.success) {
        toast({
          title: previousStatus ? '取消收藏成功' : '收藏成功',
          description: previousStatus ? '已从收藏中移除' : '已添加到收藏夹',
        });
      } else {
        throw new Error(response.message || '操作失败');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);

      // 回滚UI状态
      setFavoriteStatus({
        is_favorited: previousStatus,
        favorites_count: previousCount,
      });

      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '收藏操作失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // 按钮尺寸配置
  const sizeConfig = {
    sm: {
      button: 'h-8 px-2',
      icon: 'h-3 w-3',
      text: 'text-xs',
    },
    md: {
      button: 'h-9 px-3',
      icon: 'h-4 w-4',
      text: 'text-sm',
    },
    lg: {
      button: 'h-10 px-4',
      icon: 'h-5 w-5',
      text: 'text-base',
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* 点赞按钮 */}
      <Button
        variant={likeStatus.is_liked ? 'default' : 'outline'}
        size="sm"
        onClick={handleLike}
        disabled={isLikeLoading}
        className={cn(
          currentSize.button,
          'transition-all duration-200',
          likeStatus.is_liked
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
            : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300',
          isLikeLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Heart
          className={cn(
            currentSize.icon,
            'transition-all duration-200',
            likeStatus.is_liked && 'fill-current'
          )}
        />
        {showCounts && (
          <span className={cn(currentSize.text, 'ml-1')}>
            {likeStatus.likes_count}
          </span>
        )}
      </Button>

      {/* 收藏按钮 */}
      <Button
        variant={favoriteStatus.is_favorited ? 'default' : 'outline'}
        size="sm"
        onClick={handleFavorite}
        disabled={isFavoriteLoading}
        className={cn(
          currentSize.button,
          'transition-all duration-200',
          favoriteStatus.is_favorited
            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
            : 'hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300',
          isFavoriteLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Bookmark
          className={cn(
            currentSize.icon,
            'transition-all duration-200',
            favoriteStatus.is_favorited && 'fill-current'
          )}
        />
        {showCounts && (
          <span className={cn(currentSize.text, 'ml-1')}>
            {favoriteStatus.favorites_count}
          </span>
        )}
      </Button>
    </div>
  );
};

export default InteractionButtons;
