'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  showPlayIcon?: boolean;
  loading?: boolean;
  // 是否智能处理宽高比（避免拉伸）
  smartAspectRatio?: boolean;
  // 视频时长（秒）
  duration?: number;
}

/**
 * 优化的视频缩略图组件
 * 特性：
 * - 自动处理缺失的缩略图
 * - 美观的默认占位符
 * - 加载状态指示
 * - 播放图标覆盖
 */
export function VideoThumbnail({
  src,
  alt = '视频缩略图',
  className,
  width = 640,
  height = 360,
  showPlayIcon = true,
  loading = false,
  smartAspectRatio = true,
  duration
}: VideoThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // 显示默认占位符的条件
  const showPlaceholder = !src || imageError || loading;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200",
        "flex items-center justify-center",
        className
      )}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {showPlaceholder ? (
        // 默认占位符
        <div className="flex flex-col items-center justify-center text-slate-400 p-6">
          {loading ? (
            // 加载状态
            <div className="animate-spin">
              <Video className="h-8 w-8" />
            </div>
          ) : (
            // 默认图标
            <Video className="h-12 w-12 mb-2" />
          )}
          <span className="text-sm font-medium">
            {loading ? '生成封面中...' : '视频封面'}
          </span>
          {loading && (
            <div className="mt-2 w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>
      ) : (
        // 实际缩略图
        <>
          <Image
            src={src!}
            alt={alt}
            fill
            className={cn(
              smartAspectRatio ? "object-contain" : "object-cover",
              "transition-opacity duration-300",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* 加载中的骨架屏 */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
          )}
        </>
      )}

      {/* 播放按钮覆盖 */}
      {showPlayIcon && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm transform transition-all duration-200 hover:scale-110 hover:bg-black/70">
            <Play className="h-6 w-6 text-white fill-current translate-x-0.5" />
          </div>
        </div>
      )}

      {/* 视频时长标签 (可选) */}
      {!showPlaceholder && !loading && duration && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
}

/**
 * 视频卡片组件的缩略图部分
 * 专用于列表和网格显示
 */
export function VideoCardThumbnail({
  src,
  alt,
  duration,
  className,
  ...props
}: VideoThumbnailProps & {
  duration?: number;
}) {
  // 格式化时长
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      <VideoThumbnail
        src={src}
        alt={alt}
        className={cn("aspect-video", className)}
        {...props}
      />

      {/* 时长显示 */}
      {duration && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {formatDuration(duration)}
        </div>
      )}
    </div>
  );
}
