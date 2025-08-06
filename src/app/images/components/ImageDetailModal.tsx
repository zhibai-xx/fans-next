'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Bookmark, Download, Share2, Eye, Calendar, User, Tag, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MediaItem } from '@/services/media.service';

// 头像URL规范化函数
const normalizeAvatarUrl = (avatarUrl?: string): string => {
  if (!avatarUrl || avatarUrl === 'default_avatar.png') {
    return '/assets/zjy3.png'; // 使用现有的图片作为默认头像
  }

  // 如果已经是完整URL，直接返回
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  // 如果已经是绝对路径，直接返回
  if (avatarUrl.startsWith('/')) {
    return avatarUrl;
  }

  // 否则转换为绝对路径
  return `/${avatarUrl}`;
};

interface ImageDetailModalProps {
  image: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onLike?: (mediaId: string, isLiked: boolean) => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  image,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onLike,
  canGoNext = false,
  canGoPrevious = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (image) {
      setImageLoaded(false);
    }
  }, [image]);

  if (!image) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${image.title}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: image.description || `来自 ${image.user.username} 的精美图片`,
          url: window.location.href + '/' + image.id
        });
      } catch (error) {
        console.error('分享失败:', error);
      }
    } else {
      // 复制链接到剪贴板
      const link = window.location.href + '/' + image.id;
      navigator.clipboard.writeText(link);
      // 这里可以显示一个toast提示
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧图片区域 */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <div className="relative w-full h-full">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <Image
                src={image.url}
                alt={image.title}
                fill
                sizes="(max-width: 1024px) 100vw, 70vw"
                className={`object-contain transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>

            {/* 导航箭头 */}
            {onPrevious && canGoPrevious && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            )}

            {onNext && canGoNext && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )}
          </div>

          {/* 右侧信息区域 */}
          <div className="w-96 bg-white dark:bg-gray-900 flex flex-col">
            {/* 头部 */}
            <DialogHeader className="p-6 border-b">
              <DialogTitle className="text-xl font-bold truncate pr-8">
                {image.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                由 {image.user.username} 上传于 {formatDate(image.created_at)}
              </DialogDescription>
            </DialogHeader>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6">
                {/* 用户信息 */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    {image.user.avatar_url ? (
                      <Image
                        src={normalizeAvatarUrl(image.user.avatar_url)}
                        alt={image.user.username}
                        width={48}
                        height={48}
                        className="object-cover w-auto h-auto"
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {image.user.username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(image.created_at)}
                    </p>
                  </div>
                </div>

                {/* 描述 */}
                {image.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">描述</h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {image.description}
                    </p>
                  </div>
                )}

                {/* 标签 */}
                {image.tags && image.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">标签</h4>
                    <div className="flex flex-wrap gap-2">
                      {image.tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 分类 */}
                {image.category && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">分类</h4>
                    <Badge variant="outline" className="px-3 py-1">
                      {image.category.name}
                    </Badge>
                  </div>
                )}

                {/* 统计信息 */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">统计</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatNumber(image.views)} 次查看
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatNumber(image.likes_count)} 次点赞
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatDate(image.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-400 rounded" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatFileSize(image.size)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 图片尺寸信息 */}
                {image.width && image.height && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">尺寸</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {image.width} × {image.height} 像素
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 底部操作区域 */}
            <div className="border-t p-6">
              <div className="flex space-x-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newLikedState = !isLiked;
                    setIsLiked(newLikedState);
                    if (onLike) {
                      onLike(image.id, newLikedState);
                    }
                  }}
                  className="flex-1"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  点赞
                </Button>

                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="flex-1"
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                  收藏
                </Button>
              </div>

              <div className="flex space-x-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  分享
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 