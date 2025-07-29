'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/icons/IconRenderer';
import { WeiboFile } from '@/services/weibo-import.service';
import { useSession } from 'next-auth/react';

interface WeiboFileCardProps {
  file: WeiboFile;
  isSelected: boolean;
  onToggleSelection: () => void;
}

// 统一的API基础URL配置，与api-client.ts保持一致
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// 全局请求队列控制
class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = 0;
  private maxConcurrent = 5; // 最大并发数
  private delayBetweenRequests = 200; // 请求间隔200ms

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
          // 添加延迟，防止过快的请求
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
const requestQueue = new RequestQueue();

export const WeiboFileCard: React.FC<WeiboFileCardProps> = ({
  file,
  isSelected,
  onToggleSelection,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 获取图片预览
  useEffect(() => {
    if (file.type === 'image' && session?.accessToken) {
      setIsLoading(true);
      setImageError(false);

      const fetchImage = async () => {
        try {
          // 取消之前的请求
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          const abortController = new AbortController();
          abortControllerRef.current = abortController;

          // 使用请求队列来控制并发
          await requestQueue.add(async () => {
            // 检查是否被取消
            if (abortController.signal.aborted) {
              return;
            }

            const apiUrl = `${API_BASE_URL}/upload/weibo-preview/${file.id}`;

            console.log('正在获取图片预览:', apiUrl);
            console.log('认证令牌:', session.accessToken ? '已提供' : '未提供');

            const response = await fetch(apiUrl, {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
              signal: abortController.signal,
            });

            console.log('图片预览响应状态:', response.status);

            if (response.ok) {
              const blob = await response.blob();

              // 再次检查是否被取消
              if (abortController.signal.aborted) {
                return;
              }

              const blobUrl = URL.createObjectURL(blob);
              console.log('图片预览成功，blob URL:', blobUrl);
              setImageUrl(blobUrl);
            } else {
              if (response.status === 429) {
                console.warn('API限流，将稍后重试');
                // 对于429错误，可以考虑重试机制
                throw new Error('请求过于频繁，请稍后再试');
              } else {
                console.error('Failed to fetch image:', response.status, response.statusText);
                setImageError(true);
              }
            }
          });

        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('图片预览请求已取消');
          } else {
            console.error('Error fetching image:', error);
            setImageError(true);
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchImage();
    }

    // 清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsLoading(false);
      setImageError(false);
    };
  }, [file.id, file.type, session?.accessToken]);

  // 独立的清理effect，用于清理blob URL
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 获取文件类型图标
  const getFileTypeIcon = (type: string): string => {
    switch (type) {
      case 'image':
        return '/icons/image.svg';
      case 'video':
        return '/icons/video.svg';
      case 'gif':
        return '/icons/gif.svg';
      default:
        return '/icons/file.svg';
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
        }`}
      onClick={onToggleSelection}
    >
      <CardContent className="p-3">
        {/* 文件预览区域 */}
        <div className="relative aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
          {file.type === 'image' && !imageError ? (
            isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={file.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <IconRenderer iconName={getFileTypeIcon(file.type)} />
              </div>
            )
          ) : file.type === 'video' && !imageError ? (
            // 对于视频，我们暂时只显示图标，因为视频预览需要特殊处理
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <IconRenderer iconName={getFileTypeIcon(file.type)} />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <IconRenderer iconName={getFileTypeIcon(file.type)} />
            </div>
          )}

          {/* 选择指示器 */}
          {isSelected && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* 文件类型标签 */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {file.type.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* 文件信息 */}
        <div className="space-y-1">
          <p className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 