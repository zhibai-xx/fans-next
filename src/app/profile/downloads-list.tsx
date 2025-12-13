'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { handleApiError } from '@/lib/utils/error-handler';
import { formatDateTime } from '@/lib/utils/format';
import LoadingSpinner from '@/components/LoadingSpinner';
import { userService, Download } from '@/services/user.service';
import { DownloadService } from '@/services/download.service';
import { useToast } from '@/hooks/use-toast';
import { buildAbsoluteMediaUrl, resolveMediaImageUrl } from '@/lib/utils/media-url';
import { triggerBrowserDownload } from '@/lib/utils/download-helper';
import { VideoService } from '@/services/video.service';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Download as DownloadIcon } from 'lucide-react';

type DownloadRecord = {
  id: string;
  mediaId: string;
  mediaType: 'IMAGE' | 'VIDEO';
  title: string;
  thumbnailUrl?: string;
  fileSize?: number;
  fileType?: string;
  downloadedAt: string;
};

const formatFileSize = (size?: number) => {
  if (!size || size <= 0) return '--';
  return VideoService.formatFileSize(size);
};

export default function DownloadsList() {
  const { toast } = useToast();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadDownloads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userService.getDownloads();
      const records = response.data?.map((record: Download) => ({
        id: record.id,
        mediaId: record.media_id,
        mediaType: record.media_type,
        title: record.title,
        thumbnailUrl: record.thumbnail_url,
        fileSize: record.file_size,
        fileType: record.file_type,
        downloadedAt: record.downloaded_at,
      })) || [];
      setDownloads(records);
    } catch (err) {
      console.error('获取下载记录失败:', err);
      setError(handleApiError(err, '获取下载记录失败，请稍后重试'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handleDownload = useCallback(async (record: DownloadRecord) => {
    try {
      setDownloadingId(record.id);
      const data = await DownloadService.requestDownload(record.mediaId);
      const absoluteUrl = buildAbsoluteMediaUrl(data.download_url);
      triggerBrowserDownload(absoluteUrl, data.filename || record.title);
      toast({
        title: '开始下载',
        description: `${record.title} 正在下载`,
      });
    } catch (err) {
      console.error('重新下载失败:', err);
      toast({
        title: '下载失败',
        description: handleApiError(err, '无法下载该文件，请稍后再试'),
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  }, [toast]);

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
        <Link
          href="/images"
          className="text-blue-600 hover:text-blue-500 block mt-2"
        >
          浏览图片内容
        </Link>
        <Link
          href="/videos"
          className="text-blue-600 hover:text-blue-500 block mt-2"
        >
          浏览视频内容
        </Link>
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
                    {download.thumbnailUrl && (
                      <div className="h-10 w-10 overflow-hidden rounded relative">
                        <Image
                          src={resolveMediaImageUrl(download.thumbnailUrl)}
                          alt={download.title || '下载内容'}
                          fill
                          className="object-cover"
                          sizes="40px"
                          loading="lazy"
                          unoptimized
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
                    {download.mediaType === 'IMAGE' ? '图片' : '视频'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-500">
                    {formatFileSize(download.fileSize)}
                    {download.fileType ? ` • ${download.fileType}` : ''}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-500">
                    {formatDateTime(download.downloadedAt, { showTime: true })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="gap-1"
                    >
                      <a
                        href={`/${download.mediaType === 'VIDEO' ? 'videos' : 'images'}/${download.mediaId}`}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        查看
                      </a>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleDownload(download)}
                      disabled={downloadingId === download.id}
                    >
                      <DownloadIcon className="h-4 w-4" />
                      {downloadingId === download.id ? '下载中...' : '重新下载'}
                    </Button>
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
