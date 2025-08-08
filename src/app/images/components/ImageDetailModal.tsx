'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Bookmark, Download, Share2, Eye, Calendar, User, Tag, MoreHorizontal, FileText, Folder, BarChart3, Monitor, HardDrive, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MediaItem } from '@/services/media.service';
import type { MediaInteractionStatus } from '@/types/interaction';

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

interface ImageDetailModalProps {
  image: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onLike?: (mediaId: string, isLiked: boolean) => void;
  onFavorite?: (mediaId: string, isFavorited: boolean) => void;
  interactionStatus?: MediaInteractionStatus;
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
  onFavorite,
  interactionStatus,
  canGoNext = false,
  canGoPrevious = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

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
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] p-0 overflow-hidden">
        <div className="flex w-full h-full">
          {/* 左侧图片区域 */}
          <div className="flex-1 relative bg-black flex items-center justify-center min-h-0 max-h-full overflow-hidden">
            <div className="relative w-full h-full max-h-full">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <Image
                src={normalizeImageUrl(image.url)}
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
          <div className="w-96 h-[90vh] max-h-[90vh] bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
            {/* 头部 - 优化的用户信息和标题 */}
            <div className="flex-shrink-0 border-b bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20">
              <div className="p-4">
                {/* 用户信息区域 */}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-gray-700 shadow-sm">
                    {image.user.avatar_url ? (
                      <Image
                        src={normalizeAvatarUrl(image.user.avatar_url)}
                        alt={image.user.username}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User className="w-7 h-7 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {image.user.username}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(image.created_at)}
                    </p>
                  </div>
                </div>

                {/* 标题区域 */}
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-relaxed">
                    {image.title}
                  </DialogTitle>

                  {/* 核心统计信息 - 精简显示 */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="font-medium">{formatNumber(image.views)}</span>
                    </div>
                    <div className={`flex items-center ${interactionStatus?.is_liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                      <Heart className={`w-4 h-4 mr-1 ${interactionStatus?.is_liked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{formatNumber(interactionStatus?.likes_count || image.likes_count)}</span>
                    </div>
                    <div className={`flex items-center ${interactionStatus?.is_favorited ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}`}>
                      <Bookmark className={`w-4 h-4 mr-1 ${interactionStatus?.is_favorited ? 'fill-current' : ''}`} />
                      <span className="font-medium">{formatNumber(interactionStatus?.favorites_count || image.favorites_count)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 中间可滚动区域 - 详细信息 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 max-h-full">
              <div className="p-4 space-y-3">
                {/* 描述 */}
                {image.description && (
                  <div className="border-l-4 border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 pl-3 py-2">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center text-sm">
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      描述
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {image.description}
                    </p>
                  </div>
                )}

                {/* 标签区域 */}
                {image.tags && image.tags.length > 0 && (
                  <div className="border-l-4 border-purple-400 bg-purple-50/50 dark:bg-purple-900/10 pl-3 py-2">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center text-sm">
                      <Tag className="w-4 h-4 mr-2 text-purple-500" />
                      标签 ({image.tags.length})
                    </h4>
                    <div className={`${image.tags.length > 6 ? 'max-h-20 overflow-y-auto pr-2' : ''}`}>
                      <div className="flex flex-wrap gap-1.5">
                        {image.tags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 分类信息 */}
                {image.category && (
                  <div className="border-l-4 border-green-400 bg-green-50/50 dark:bg-green-900/10 pl-3 py-2">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center text-sm">
                      <Folder className="w-4 h-4 mr-2 text-green-500" />
                      分类
                    </h4>
                    <Badge variant="outline" className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                      {image.category.name}
                    </Badge>
                  </div>
                )}

                {/* 详细信息 */}
                <div className="border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10 pl-3 py-2">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center text-sm">
                    <BarChart3 className="w-4 h-4 mr-2 text-amber-500" />
                    详细信息
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Monitor className="w-3 h-3 mr-2" />
                        <span>尺寸</span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {image.width && image.height ? `${image.width} × ${image.height}` : '未知'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <HardDrive className="w-3 h-3 mr-2" />
                        <span>文件大小</span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatFileSize(image.size)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3 mr-2" />
                        <span>上传时间</span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatDate(image.created_at)}
                      </span>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* 底部固定操作区域 */}
            <div className="flex-shrink-0 border-t bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20 p-4">
              <div className="space-y-2">
                {/* 主要操作按钮 */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={(interactionStatus?.is_liked) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (onLike) {
                        onLike(image.id, interactionStatus?.is_liked || false);
                      }
                    }}
                    className={`transition-all duration-300 transform hover:scale-105 ${interactionStatus?.is_liked
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg shadow-red-500/25 border-red-500'
                      : 'hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${interactionStatus?.is_liked ? 'fill-current' : ''}`} />
                    <span className="font-medium">点赞</span>
                  </Button>

                  <Button
                    variant={(interactionStatus?.is_favorited) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (onFavorite) {
                        onFavorite(image.id, interactionStatus?.is_favorited || false);
                      }
                    }}
                    className={`transition-all duration-300 transform hover:scale-105 ${interactionStatus?.is_favorited
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25 border-blue-500'
                      : 'hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                  >
                    <Bookmark className={`w-4 h-4 mr-2 ${interactionStatus?.is_favorited ? 'fill-current' : ''}`} />
                    <span className="font-medium">收藏</span>
                  </Button>
                </div>

                {/* 次要操作按钮 */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="transition-all duration-300 transform hover:scale-105 hover:border-green-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 group"
                  >
                    <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                    <span className="font-medium">下载</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="transition-all duration-300 transform hover:scale-105 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 group"
                  >
                    <Share2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="font-medium">分享</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 