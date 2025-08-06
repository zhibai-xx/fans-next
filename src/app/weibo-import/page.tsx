'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/query-client';
import OptimizedWeiboFileCard from './components/OptimizedWeiboFileCard';
import {
  useScanWeiboFiles,
  useWeiboUserFiles,
  useBatchUploadMutation,
  useUploadSingleFileMutation,
  useDeleteFileMutation,
  usePreviewFileMutation,
  weiboImportQueryUtils
} from '@/hooks/queries/useWeiboImport';

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
const ITEMS_PER_PAGE = 20;

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

export default function WeiboImportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // 本地UI状态
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<{
    completed: number;
    total: number;
    current?: string;
  }>({ completed: 0, total: 0 });
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'gif'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  // 使用TanStack Query hooks
  const {
    data: scanResult,
    isLoading: isScanning,
    refetch: refetchScan,
    error: scanError
  } = useScanWeiboFiles();

  const {
    data: userFilesData,
    isLoading: isLoadingFiles
  } = useWeiboUserFiles(filterUser !== 'all' ? filterUser : undefined, currentPage, ITEMS_PER_PAGE);

  // Mutation hooks
  const batchUploadMutation = useBatchUploadMutation();
  const uploadSingleMutation = useUploadSingleFileMutation();
  const deleteFileMutation = useDeleteFileMutation();
  const previewFileMutation = usePreviewFileMutation();

  // 用户认证检查
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // 获取所有文件的扁平列表
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

  // 应用过滤条件
  const filteredFiles = useMemo(() => {
    let files = allFiles;

    // 按类型过滤
    if (filterType !== 'all') {
      files = files.filter(file => file.type === filterType);
    }

    // 按用户过滤
    if (filterUser !== 'all') {
      files = files.filter(file => file.userId === filterUser);
    }

    return files;
  }, [allFiles, filterType, filterUser]);

  // 分页处理
  const paginatedFiles = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredFiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFiles, currentPage]);

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

  // 扫描文件
  const handleScan = useCallback(async () => {
    try {
      await refetchScan();
      toast({
        title: '扫描完成',
        description: `发现 ${scanResult?.totalFiles || 0} 个文件`,
      });
    } catch (error) {
      console.error('扫描失败:', error);
    }
  }, [refetchScan, scanResult?.totalFiles, toast]);

  // 批量上传
  const handleBatchUpload = useCallback(async () => {
    if (selectedFiles.size === 0) {
      toast({
        title: '请选择文件',
        description: '请先选择要上传的文件',
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = Array.from(selectedFiles).map(fileId => {
      const file = filteredFiles.find(f => f.id === fileId);
      return file ? { id: file.id, path: file.path, name: file.name } : null;
    }).filter(Boolean) as Array<{ id: string; path: string; name: string }>;

    batchUploadMutation.mutate({
      files: filesToUpload,
      onProgress: (progress) => {
        setUploadProgress(progress);
      }
    });
  }, [selectedFiles, filteredFiles, batchUploadMutation]);

  // 单个文件上传
  const handleSingleUpload = useCallback((file: WeiboFile & { userId: string }) => {
    uploadSingleMutation.mutate({
      filePath: file.path,
      fileName: file.name,
      metadata: {
        userId: file.userId,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      }
    });
  }, [uploadSingleMutation]);

  // 删除文件
  const handleDeleteFile = useCallback((filePath: string) => {
    deleteFileMutation.mutate(filePath);
  }, [deleteFileMutation]);

  // 预览文件
  const handlePreviewFile = useCallback((filePath: string) => {
    previewFileMutation.mutate(filePath);
  }, [previewFileMutation]);

  // 文件选择处理
  const handleFileSelect = useCallback((fileId: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(fileId);
      } else {
        newSet.delete(fileId);
      }
      return newSet;
    });
  }, []);

  // 全选/取消全选
  const handleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedFiles(new Set(paginatedFiles.map(f => f.id)));
    } else {
      setSelectedFiles(new Set());
    }
  }, [paginatedFiles]);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    weiboImportQueryUtils.invalidateAll(queryClient);
  }, []);

  if (!user) {
    return null; // 重定向处理中
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              微博文件导入
            </h1>
            <p className="text-gray-600">
              扫描并导入微博下载的图片和视频文件
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={handleRefresh} variant="outline">
              刷新
            </Button>
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isScanning ? (
                <>
                  <Spinner className="mr-2" />
                  扫描中...
                </>
              ) : (
                '开始扫描'
              )}
            </Button>
          </div>
        </div>

        {/* 扫描错误提示 */}
        {scanError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                扫描失败: {scanError instanceof Error ? scanError.message : '未知错误'}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 扫描结果统计 */}
        {scanResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总文件数</p>
                    <p className="text-2xl font-bold text-blue-600">{scanResult.totalFiles}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">用户数量</p>
                    <p className="text-2xl font-bold text-green-600">{scanResult.users.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总大小</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(scanResult.totalSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 筛选和操作栏 */}
        {scanResult && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* 类型筛选 */}
                  <div>
                    <Label htmlFor="filter-type" className="text-sm font-medium">
                      文件类型
                    </Label>
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

                  {/* 用户筛选 */}
                  <div>
                    <Label htmlFor="filter-user" className="text-sm font-medium">
                      用户
                    </Label>
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

                  {/* 选择状态 */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      已选择: {selectedFiles.size}
                    </Badge>
                    <Badge variant="outline">
                      筛选结果: {filteredFiles.length}
                    </Badge>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(selectedFiles.size === 0)}
                  >
                    {selectedFiles.size > 0 ? '取消全选' : '全选当前页'}
                  </Button>
                  <Button
                    onClick={handleBatchUpload}
                    disabled={selectedFiles.size === 0 || batchUploadMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {batchUploadMutation.isPending ? (
                      <>
                        <Spinner className="mr-2" />
                        上传中...
                      </>
                    ) : (
                      `批量上传 (${selectedFiles.size})`
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 上传进度 */}
        {batchUploadMutation.isPending && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>上传进度</span>
                  <span>{uploadProgress.completed}/{uploadProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress.total > 0 ? (uploadProgress.completed / uploadProgress.total) * 100 : 0}%`
                    }}
                  />
                </div>
                {uploadProgress.current && (
                  <p className="text-sm text-gray-600">
                    当前: {uploadProgress.current}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 文件列表 */}
        {scanResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>文件列表</span>
                <PaginationInfo
                  currentPage={currentPage + 1}
                  totalPages={totalPages}
                  startIndex={currentPage * ITEMS_PER_PAGE + 1}
                  endIndex={Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredFiles.length)}
                  totalItems={filteredFiles.length}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFiles ? (
                <div className="flex justify-center items-center py-16">
                  <Spinner className="mr-2" />
                  <span>加载文件列表...</span>
                </div>
              ) : paginatedFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedFiles.map(file => (
                    <OptimizedWeiboFileCard
                      key={file.id}
                      file={file}
                      isSelected={selectedFiles.has(file.id)}
                      onSelect={(selected) => handleFileSelect(file.id, selected)}
                      onUpload={() => handleSingleUpload(file)}
                      onDelete={() => handleDeleteFile(file.path)}
                      onPreview={() => handlePreviewFile(file.path)}
                      isUploading={uploadSingleMutation.isPending}
                      isDeleting={deleteFileMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg">暂无文件</p>
                  <p className="text-sm">请先扫描文件或调整筛选条件</p>
                </div>
              )}

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-gray-600">
                    第 {currentPage + 1} 页，共 {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}