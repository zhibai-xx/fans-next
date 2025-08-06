'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { handleApiError } from '@/lib/utils/error-handler';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDateTime } from '@/lib/utils/format';

type Favorite = {
  id: string;
  itemId: string;
  itemType: string;
  createdAt: string;
  // 这些是从关联资源获取的数据
  title?: string;
  thumbnail?: string;
  description?: string;
};

export default function FavoritesList() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.accessToken) {
        setIsLoading(false);
        setError('用户未登录或登录已过期');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/user/favorites`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('获取收藏失败');
        }

        const data = await response.json();
        setFavorites(data.favorites || []);
      } catch (error) {
        console.error('获取收藏失败:', error);
        setError(handleApiError(error, '获取收藏列表失败，请稍后重试'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [session]);

  const removeFavorite = async (id: string) => {
    if (!session?.accessToken) {
      setError('用户未登录或登录已过期');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/favorites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('取消收藏失败');
      }

      // 更新列表
      setFavorites(favorites.filter(favorite => favorite.id !== id));
    } catch (error) {
      console.error('取消收藏失败:', error);
      setError(handleApiError(error, '取消收藏失败，请稍后重试'));
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner className="justify-center" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6 inline-block">
          {error}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>您还没有收藏任何内容</p>
        <a
          href="/images"
          className="text-blue-600 hover:text-blue-500 block mt-2"
        >
          浏览图片内容
        </a>
        <a
          href="/videos"
          className="text-blue-600 hover:text-blue-500 block mt-2"
        >
          浏览视频内容
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
          >
            {favorite.thumbnail && (
              <div className="h-40 overflow-hidden">
                <img
                  src={favorite.thumbnail}
                  alt={favorite.title || '收藏内容'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">
                  {favorite.title || '未命名内容'}
                </h3>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  {favorite.itemType === 'image' ? '图片' :
                    favorite.itemType === 'video' ? '视频' : favorite.itemType}
                </span>
              </div>

              {favorite.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {favorite.description}
                </p>
              )}

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {formatDateTime(favorite.createdAt, { showTime: false })}
                </span>

                <div className="space-x-2">
                  <a
                    href={`/${favorite.itemType}s/${favorite.itemId}`}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-blue-600 hover:text-blue-500"
                  >
                    查看
                  </a>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFavorite(favorite.id)}
                    className="text-xs h-6 px-2"
                  >
                    取消收藏
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 