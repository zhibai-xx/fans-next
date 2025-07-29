'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/icons/IconRenderer';
import { WeiboFileCard } from './WeiboFileCard';

interface WeiboFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'gif';
  lastModified: string;
  thumbnail?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  selected?: boolean;
}

interface WeiboUser {
  userId: string;
  userName: string;
  totalFiles: number;
  files: WeiboFile[];
}

interface ScanResult {
  users: WeiboUser[];
  totalFiles: number;
  totalSize: number;
}

interface WeiboFileGridProps {
  scanResult: ScanResult;
  selectedFiles: Set<string>;
  onToggleSelection: (fileId: string) => void;
  onSelectAll: (userId?: string) => void;
}

export const WeiboFileGrid: React.FC<WeiboFileGridProps> = ({
  scanResult,
  selectedFiles,
  onToggleSelection,
  onSelectAll,
}) => {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // 切换用户展开状态
  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // 获取文件类型统计
  const getFileTypeStats = (files: WeiboFile[]) => {
    const stats = files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return stats;
  };

  // 获取选中文件统计
  const getSelectedStats = (files: WeiboFile[]) => {
    const selectedUserFiles = files.filter(f => selectedFiles.has(f.id));
    return selectedUserFiles.length;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {scanResult.users.map(user => {
        const isExpanded = expandedUsers.has(user.userId);
        const fileStats = getFileTypeStats(user.files);
        const selectedCount = getSelectedStats(user.files);
        const totalSize = user.files.reduce((sum, file) => sum + file.size, 0);

        return (
          <Card key={user.userId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleUserExpansion(user.userId)}
                    className="flex items-center gap-2"
                  >
                    <IconRenderer
                      iconName={isExpanded ? "/icons/chevron-down.svg" : "/icons/chevron-right.svg"}
                    />
                    <IconRenderer iconName="/icons/user.svg" />
                    <span className="font-semibold">用户 {user.userName}</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{user.totalFiles} 个文件</Badge>
                    <Badge variant="outline">{formatFileSize(totalSize)}</Badge>
                    {selectedCount > 0 && (
                      <Badge variant="default">已选择 {selectedCount}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectAll(user.userId)}
                    className="flex items-center gap-2"
                  >
                    <IconRenderer iconName="/icons/select-all.svg" />
                    {selectedCount === user.totalFiles ? '取消全选' : '全选'}
                  </Button>
                </div>
              </div>

              {/* 文件类型统计 */}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {fileStats.image && (
                  <div className="flex items-center gap-1">
                    <IconRenderer iconName="/icons/image.svg" />
                    <span>{fileStats.image} 图片</span>
                  </div>
                )}
                {fileStats.video && (
                  <div className="flex items-center gap-1">
                    <IconRenderer iconName="/icons/video.svg" />
                    <span>{fileStats.video} 视频</span>
                  </div>
                )}
                {fileStats.gif && (
                  <div className="flex items-center gap-1">
                    <IconRenderer iconName="/icons/gif.svg" />
                    <span>{fileStats.gif} 动图</span>
                  </div>
                )}
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {user.files.map(file => (
                    <WeiboFileCard
                      key={file.id}
                      file={file}
                      isSelected={selectedFiles.has(file.id)}
                      onToggleSelection={() => onToggleSelection(file.id)}
                    />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}; 