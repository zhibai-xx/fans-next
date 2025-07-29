'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { IconRenderer } from '@/components/icons/IconRenderer';
import { Spinner } from '@/components/Spinner';
import { UploadResult } from '@/services/weibo-import.service';

interface WeiboUploadProgressProps {
  uploadProgress: UploadResult[];
  isUploading: boolean;
}

export const WeiboUploadProgress: React.FC<WeiboUploadProgressProps> = ({
  uploadProgress,
  isUploading,
}) => {
  const totalFiles = uploadProgress.length;
  const completedFiles = uploadProgress.filter(p => p.success || p.error).length;
  const successFiles = uploadProgress.filter(p => p.success).length;
  const failedFiles = uploadProgress.filter(p => !p.success && p.error).length;
  const progressPercentage = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 总体进度 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isUploading ? (
              <Spinner size="sm" />
            ) : (
              <IconRenderer iconName="/icons/upload.svg" />
            )}
            上传进度
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>总进度</span>
              <span>{completedFiles}/{totalFiles} 文件</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">成功: {successFiles}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">失败: {failedFiles}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-sm">待处理: {totalFiles - completedFiles}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细进度列表 */}
      <Card>
        <CardHeader>
          <CardTitle>上传详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {uploadProgress.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <IconRenderer iconName="/icons/check.svg" />
                      </div>
                    ) : result.error ? (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <IconRenderer iconName="/icons/x.svg" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <Spinner size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.fileName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {result.filePath}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.success && (
                    <Badge variant="default">成功</Badge>
                  )}
                  {result.error && (
                    <Badge variant="destructive">失败</Badge>
                  )}
                  {!result.success && !result.error && (
                    <Badge variant="secondary">处理中</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 