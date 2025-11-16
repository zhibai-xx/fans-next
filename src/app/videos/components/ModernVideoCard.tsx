'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VideoItem, VideoService } from '@/services/video.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import {
  Heart,
  Eye,
  Clock,
  Play,
  Bookmark,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import {
  useLikeVideoMutation,
  useFavoriteVideoMutation,
  useVideoInteractionStatus
} from '@/hooks/useVideos';
import { useToast } from '@/hooks/use-toast';

interface ModernVideoCardProps {
  video: VideoItem;
  className?: string;
  showActions?: boolean;
}

export function ModernVideoCard({ video, className, showActions = true }: ModernVideoCardProps) {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes_count || 0);

  // Mutations
  const likeMutation = useLikeVideoMutation();
  const favoriteMutation = useFavoriteVideoMutation();
  const { data: interactionStatus } = useVideoInteractionStatus(video.id);

  const tags = useMemo(() => {
    if (video.tags?.length) {
      return video.tags;
    }
    const legacyTags = (video as any).media_tags?.map((item: any) => item.tag);
    return legacyTags || [];
  }, [video]);

  useEffect(() => {
    if (interactionStatus?.data) {
      setIsLiked(interactionStatus.data.isLiked);
      setIsFavorited(interactionStatus.data.isFavorited);
      setLikeCount(
        interactionStatus.data.likesCount ?? video.likes_count ?? 0
      );
      return;
    }

    // 默认回退到视频原始统计
    setIsLiked(false);
    setIsFavorited(false);
    setLikeCount(video.likes_count || 0);
  }, [interactionStatus?.data, video.id, video.likes_count]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newLikedState = !isLiked;
    const delta = newLikedState ? 1 : -1;

    setIsLiked(newLikedState);
    setLikeCount((prev) => Math.max(0, (prev || 0) + delta));

    likeMutation.mutate(
      { videoId: video.id, isLiked: newLikedState },
      {
        onError: () => {
          setIsLiked(!newLikedState);
          setLikeCount((prev) => Math.max(0, (prev || 0) - delta));
        },
      }
    );
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavoritedState = !isFavorited;
    setIsFavorited(newFavoritedState);
    favoriteMutation.mutate(
      { videoId: video.id, isFavorited: newFavoritedState },
      {
        onError: () => {
          setIsFavorited(!newFavoritedState);
        },
      }
    );
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          url: `${window.location.origin}/videos/${video.id}`,
        });
      } catch (err) {
        console.log('分享被取消或失败');
      }
    } else {
      // 备用分享方案：复制到剪贴板
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/videos/${video.id}`);
        toast({
          title: '链接已复制',
          description: '快邀请朋友一起来看吧～',
          duration: 2000,
        });
      } catch (err) {
        console.log('复制失败');
        toast({
          title: '复制失败',
          description: '请稍后再试',
          variant: 'destructive',
        });
      }
    }
  };

  // 获取缩略图URL
  const thumbnailUrl = video.thumbnails?.cover || video.thumbnail_url || '/assets/video-placeholder.jpg';

  // 格式化发布时间
  const formatPublishedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '刚刚发布';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}天前`;
    if (diffInHours < 24 * 30) return `${Math.floor(diffInHours / (24 * 7))}周前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-800 flex flex-col h-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/videos/${video.id}`}>
        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* 播放按钮覆盖层 */}
          <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" />
            </div>
          </div>

          {/* 时长标签 */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {VideoService.formatDuration(video.duration)}
          </div>

          {/* 状态标签 */}
          {video.status === 'PROCESSING' && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                处理中
              </Badge>
            </div>
          )}

          {video.video_qualities && video.video_qualities.length > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                HD
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="flex flex-col flex-1 p-4">
        <Link href={`/videos/${video.id}`}>
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-blue-600 transition-colors mb-3">
            {video.title}
          </h3>
        </Link>

        {/* 用户信息 */}
        <div className="flex items-center space-x-3 mb-3">
          <UserAvatar
            src={video.user.avatar_url}
            name={video.user.nickname || video.user.username}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {video.user.username}
            </p>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
              <div className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                <span>{VideoService.formatViews(video.views)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatPublishedAt(video.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1 mb-3 min-h-[1.5rem]">
          {tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs px-2 py-0.5"
            >
              {tag.name}
            </Badge>
          ))}
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 h-8 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}`}
                onClick={handleLike}
                disabled={likeMutation.isPending}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="ml-1 text-xs">{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`p-2 h-8 ${isFavorited ? 'text-blue-500 hover:text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                onClick={handleFavorite}
                disabled={favoriteMutation.isPending}
              >
                <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-8 text-gray-500 hover:text-gray-700"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
