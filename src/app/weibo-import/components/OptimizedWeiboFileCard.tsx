'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/icons/IconRenderer';

interface WeiboFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'gif';
  lastModified: string;
}

interface OptimizedWeiboFileCardProps {
  file: WeiboFile;
  isSelected: boolean;
  onToggleSelection: () => void;
  isVisible?: boolean; // 用于懒加载控制
}

// 统一的API基础URL配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// 全局请求队列控制 - 优化版
class OptimizedRequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = 0;
  private maxConcurrent = 3; // 降低并发数以减少内存压力
  private delayBetweenRequests = 300; // 增加间隔时间

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.running++;
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          setTimeout(() => {
            this.processNext();
          }, this.delayBetweenRequests);
        }
      };

      this.queue.push(task);
      this.processNext();
    });
  }

  private processNext() {
    if (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task();
      }
    }
  }
}

// 全局请求队列实例
const optimizedRequestQueue = new OptimizedRequestQueue();

// 图片缓存管理
const imageCache = new Map<string, string>();

// 清理过期的缓存项
const cleanupCache = () => {
  if (imageCache.size > 50) { // 限制缓存大小
    const entries = Array.from(imageCache.entries());
    entries.slice(0, 10).forEach(([key, value]) => {
      URL.revokeObjectURL(value);
      imageCache.delete(key);
    });
  }
};

const OptimizedWeiboFileCard: React.FC<OptimizedWeiboFileCardProps> = memo(({
  file,
  isSelected,
  onToggleSelection,
  isVisible = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const abortControllerRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // 使用IntersectionObserver实现懒加载
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin: '200px', // 提前200px开始加载
        threshold: 0.1,
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 优化的图片获取函数
  const fetchOptimizedImage = useCallback(async () => {
    if (!session?.accessToken || !isIntersecting || !isVisible) return;

    // 检查缓存
    const cacheKey = `${file.id}-${session.accessToken?.slice(-10)}`;
    if (imageCache.has(cacheKey)) {
      setImageUrl(imageCache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    setImageError(false);

    try {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      await optimizedRequestQueue.add(async () => {
        if (abortController.signal.aborted) return;

        const apiUrl = `${API_BASE_URL}/upload/weibo-preview/${file.id}`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          signal: abortController.signal,
        });

        if (response.ok) {
          const blob = await response.blob();

          if (abortController.signal.aborted) return;

          // 创建优化的图片处理
          const optimizedBlob = await createOptimizedImage(blob, file.size);
          const blobUrl = URL.createObjectURL(optimizedBlob);

          // 添加到缓存
          imageCache.set(cacheKey, blobUrl);
          setImageUrl(blobUrl);

          // 清理缓存
          cleanupCache();
        } else {
          if (response.status === 429) {
            // 对于429错误，延迟重试
            setTimeout(() => {
              fetchOptimizedImage();
            }, 2000);
          } else {
            setImageError(true);
          }
        }
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setImageError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [file.id, session?.accessToken, isIntersecting, isVisible, file.size]);

  // 创建优化的图片
  const createOptimizedImage = async (blob: Blob, originalSize: number): Promise<Blob> => {
    return new Promise((resolve) => {
      // 如果图片小于1MB，直接返回
      if (originalSize < 1024 * 1024) {
        resolve(blob);
        return;
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      img.onload = () => {
        // 计算优化后的尺寸（最大400x400）
        const maxSize = 400;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制优化后的图片
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (optimizedBlob) => {
            resolve(optimizedBlob || blob);
          },
          'image/jpeg',
          0.8 // 80%质量，平衡文件大小和清晰度
        );
      };

      img.onerror = () => resolve(blob);
      img.src = URL.createObjectURL(blob);
    });
  };

  // 懒加载触发
  useEffect(() => {
    if (file.type === 'image' && isIntersecting && isVisible) {
      fetchOptimizedImage();
    }
  }, [file.type, fetchOptimizedImage]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 优化的事件处理函数
  const handleToggleSelection = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelection();
  }, [onToggleSelection]);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // 获取文件类型图标
  const getFileTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'gif':
        return 'gif';
      default:
        return 'file';
    }
  }, []);

  return (
    <div ref={cardRef} className="relative">
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected
            ? 'ring-2 ring-blue-500 shadow-lg'
            : 'hover:shadow-md'
          }`}
        onClick={handleToggleSelection}
        style={{
          transform: isSelected ? 'scale(0.98)' : 'scale(1)', // 使用transform而不是改变DOM
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <CardContent className="p-3">
          {/* 文件预览区域 */}
          <div className="relative aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
            {file.type === 'image' && !imageError ? (
              isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <div className="animate-pulse w-8 h-8 bg-blue-200 rounded-full"></div>
                </div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setImageError(true)}
                  style={{
                    transition: 'opacity 0.3s ease',
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <IconRenderer iconName={getFileTypeIcon(file.type)} />
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <IconRenderer iconName={getFileTypeIcon(file.type)} />
              </div>
            )}

            {/* 选择指示器 - 使用CSS animation */}
            <div
              className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${isSelected
                  ? 'bg-blue-500 transform scale-110 shadow-lg'
                  : 'bg-white/80 backdrop-blur-sm border border-gray-300'
                }`}
            >
              {isSelected ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              )}
            </div>

            {/* 文件类型标签 */}
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs bg-black/50 text-white border-none">
                {file.type.toUpperCase()}
              </Badge>
            </div>

            {/* 大文件提示 */}
            {file.size > 5 * 1024 * 1024 && (
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                  大文件
                </Badge>
              </div>
            )}
          </div>

          {/* 文件信息 */}
          <div className="space-y-1">
            <p
              className="text-sm font-medium truncate"
              title={file.name}
              style={{ lineHeight: '1.2' }}
            >
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

OptimizedWeiboFileCard.displayName = 'OptimizedWeiboFileCard';

export default OptimizedWeiboFileCard; 