'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { handleApiError } from '@/lib/utils/error-handler';
import { formatDateTime } from '@/lib/utils/format';
import LoadingSpinner from '@/components/LoadingSpinner';

type Download = {
  id: string;
  itemId: string;
  itemType: string;
  createdAt: string;
  // 这些是从关联资源获取的数据
  title?: string;
  thumbnail?: string;
  fileSize?: string;
  fileType?: string;
};

export default function DownloadsList() {
  const { data: session } = useSession();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const fetchDownloads = async () => {
      if (!session?.accessToken) {
        setIsLoading(false);
        setError('用户未登录或登录已过期');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/user/downloads`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('获取下载记录失败');
        }

        const data = await response.json();
        setDownloads(data.downloads || []);
      } catch (error) {
        console.error('获取下载记录失败:', error);
        setError(handleApiError(error, '获取下载记录失败，请稍后重试'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDownloads();
  }, [session]);

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

  if (downloads.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>您还没有下载过任何内容</p>
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3">内容</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">文件信息</th>
              <th className="px-4 py-3">下载时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {downloads.map((download) => (
              <tr
                key={download.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    {download.thumbnail && (
                      <div className="h-10 w-10 overflow-hidden rounded">
                        <img
                          src={download.thumbnail}
                          alt={download.title || '下载内容'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <span className="font-medium">
                      {download.title || '未命名内容'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                    {download.itemType === 'image' ? '图片' :
                      download.itemType === 'video' ? '视频' : download.itemType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {download.fileSize && download.fileType ? (
                    <span className="text-gray-500">
                      {download.fileSize} • {download.fileType}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      --
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-500">
                    {formatDateTime(download.createdAt, { showTime: false })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <a
                      href={`/${download.itemType}s/${download.itemId}`}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-blue-600 hover:text-blue-500"
                    >
                      查看
                    </a>
                    <a
                      href={`${API_URL}/download/${download.itemType}/${download.itemId}`}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-blue-600 hover:text-blue-500"
                    >
                      重新下载
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 