'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/icons/IconRenderer';
import { ScanResult } from '@/services/weibo-import.service';

interface WeiboFileStatsProps {
  scanResult: ScanResult;
  selectedCount: number;
}

export const WeiboFileStats: React.FC<WeiboFileStatsProps> = ({
  scanResult,
  selectedCount,
}) => {
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 计算文件类型统计
  const fileTypeStats = scanResult.users.reduce((acc, user) => {
    user.files.forEach(file => {
      acc[file.type] = (acc[file.type] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 总文件数 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总文件数</p>
              <p className="text-2xl font-bold text-gray-900">{scanResult.totalFiles}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <IconRenderer iconName="/icons/file.svg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 总大小 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总大小</p>
              <p className="text-2xl font-bold text-gray-900">{formatFileSize(scanResult.totalSize)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <IconRenderer iconName="/icons/storage.svg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户数 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">用户数</p>
              <p className="text-2xl font-bold text-gray-900">{scanResult.users.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <IconRenderer iconName="/icons/user.svg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 已选择文件数 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已选择</p>
              <p className="text-2xl font-bold text-gray-900">{selectedCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <IconRenderer iconName="/icons/select.svg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文件类型统计 */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">文件类型分布</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(fileTypeStats).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <IconRenderer iconName={
                  type === 'image' ? '/icons/image.svg' :
                    type === 'video' ? '/icons/video.svg' :
                      type === 'gif' ? '/icons/gif.svg' : '/icons/file.svg'
                } />
                <span className="text-sm text-gray-600">{type.toUpperCase()}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 