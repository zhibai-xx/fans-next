'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/Spinner';
import { weiboImportService } from '@/services/weibo-import.service';
import OptimizedWeiboFileCard from '../weibo-import/components/OptimizedWeiboFileCard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

interface WeiboFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'gif';
  lastModified: string;
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

interface UploadResult {
  filePath: string;
  fileName: string;
  uploadId?: string;
  success: boolean;
  needUpload?: boolean;
  mediaId?: string;
  error?: string;
}

// 分页配置
const ITEMS_PER_PAGE = 15; // 个人中心中减少每页数量

// 优化的分页信息组件
const PaginationInfo = React.memo<{
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}>(({ currentPage, totalPages, startIndex, endIndex, totalItems }) => (
  <div className="text-sm text-gray-500">
    显示 {startIndex} - {endIndex} 条，共 {totalItems} 条
  </div>
));

PaginationInfo.displayName = 'PaginationInfo';

export default function WeiboImportTab() {
  const { hasPermission, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [customScanPath, setCustomScanPath] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'gif'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  // 获取所有文件的扁平列表 - 使用useMemo优化
  const allFiles = useMemo(() => {
    if (!scanResult) return [];

    const files: (WeiboFile & { userId: string })[] = [];
    scanResult.users.forEach(user => {
      user.files.forEach(file => {
        files.push({ ...file, userId: user.userId });
      });
    });

    return files;
  }, [scanResult]);

  // 应用过滤条件 - 使用useMemo优化
  const filteredFiles = useMemo(() => {
    let files = allFiles;

    if (filterType !== 'all') {
      files = files.filter(file => file.type === filterType);
    }

    if (filterUser !== 'all') {
      files = files.filter(file => file.userId === filterUser);
    }

    return files;
  }, [allFiles, filterType, filterUser]);

  // 计算分页 - 使用useMemo优化
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredFiles.length);
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex: startIndex + 1,
      endIndex,
      paginatedFiles
    };
  }, [filteredFiles, currentPage]);

  // 重置分页当过滤条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterUser]);

  // 优化的事件处理函数 - 使用useCallback
  const handleScanFiles = useCallback(async () => {
    setIsScanning(true);
    try {
      const scanPath = customScanPath.trim() || undefined;
      const result = await weiboImportService.scanWeiboFiles(scanPath);
      setScanResult(result);
      setCurrentPage(1);
      toast({
        title: '扫描完成',
        description: `共发现 ${result.totalFiles} 个媒体文件`,
      });
    } catch (error: any) {
      toast({
        title: '扫描失败',
        description: error.message || '扫描weibo文件夹失败',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }, [customScanPath, toast]);

  const handleToggleFile = useCallback((filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  const handleBatchUpload = useCallback(async () => {
    if (selectedFiles.size === 0) {
      toast({
        title: '请选择文件',
        description: '请先选择要上传的文件',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const selectedFilePaths = Array.from(selectedFiles);
      const results = await weiboImportService.batchUploadFiles(selectedFilePaths);
      setUploadResults(results);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      toast({
        title: '批量上传完成',
        description: `成功: ${successCount} 个，失败: ${failCount} 个`,
      });

      setSelectedFiles(new Set());
    } catch (error: any) {
      toast({
        title: '批量上传失败',
        description: error.message || '批量上传失败',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, toast]);

  if (authLoading) {
    return <div className="animate-pulse bg-gray-200 rounded-md h-40" />;
  }

  return (
    <PermissionGuard permission="weibo-import">
      <div className="space-y-6">
        {/* 功能说明 */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                管理员功能
              </Badge>
              微博文件导入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 text-sm">
              此功能允许管理员扫描并导入weibo-crawler下载的媒体文件。仅管理员可见和使用。
            </p>
          </CardContent>
        </Card>

        {/* 扫描配置 */}
        <Card>
          <CardHeader>
            <CardTitle>扫描配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scanPath">自定义扫描路径（可选）</Label>
              <Input
                id="scanPath"
                type="text"
                placeholder="留空使用默认路径"
                value={customScanPath}
                onChange={(e) => setCustomScanPath(e.target.value)}
              />
            </div>

            <Button
              onClick={handleScanFiles}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  正在扫描...
                </>
              ) : (
                '扫描文件'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 扫描结果 */}
        {scanResult && (
          <>
            {/* 统计信息 */}
            <Card>
              <CardHeader>
                <CardTitle>扫描结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {scanResult.users.length}
                    </div>
                    <div className="text-sm text-gray-500">用户</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {scanResult.totalFiles}
                    </div>
                    <div className="text-sm text-gray-500">总文件</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(scanResult.totalSize / 1024 / 1024)}MB
                    </div>
                    <div className="text-sm text-gray-500">总大小</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedFiles.size}
                    </div>
                    <div className="text-sm text-gray-500">已选择</div>
                  </div>
                </div>

                {/* 过滤器 */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filterType">类型:</Label>
                    <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="image">图片</SelectItem>
                        <SelectItem value="video">视频</SelectItem>
                        <SelectItem value="gif">GIF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="filterUser">用户:</Label>
                    <Select value={filterUser} onValueChange={setFilterUser}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部用户</SelectItem>
                        {scanResult.users.map(user => (
                          <SelectItem key={user.userId} value={user.userId}>
                            {user.userName} ({user.totalFiles})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 分页信息 */}
                <div className="flex items-center justify-between mb-4">
                  <PaginationInfo
                    currentPage={currentPage}
                    totalPages={paginationData.totalPages}
                    startIndex={paginationData.startIndex}
                    endIndex={paginationData.endIndex}
                    totalItems={filteredFiles.length}
                  />
                  <Button
                    onClick={handleBatchUpload}
                    disabled={selectedFiles.size === 0 || isUploading}
                    size="sm"
                  >
                    {isUploading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        上传中...
                      </>
                    ) : (
                      `上传选中 (${selectedFiles.size})`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 文件网格 - 紧凑显示 */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {paginationData.paginatedFiles.map((file) => (
                    <OptimizedWeiboFileCard
                      key={file.id}
                      file={file}
                      isSelected={selectedFiles.has(file.path)}
                      onToggleSelection={() => handleToggleFile(file.path)}
                      isVisible={true}
                    />
                  ))}
                </div>

                {/* 简化的分页控制 */}
                {paginationData.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {currentPage} 页，共 {paginationData.totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                      disabled={currentPage === paginationData.totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* 上传结果 */}
        {uploadResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>上传结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{result.fileName}</span>
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.success ? '成功' : '失败'}
                      </Badge>
                    </div>
                    {result.error && (
                      <div className="text-xs mt-1 text-red-600">
                        错误: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
} 