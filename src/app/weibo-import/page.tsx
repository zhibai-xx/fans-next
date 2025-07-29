'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/Spinner';
import { weiboImportService } from '@/services/weibo-import.service';
import OptimizedWeiboFileCard from './components/OptimizedWeiboFileCard';

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
const ITEMS_PER_PAGE = 20; // 减少每页数量以提高性能

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

// 优化的页码组件
const PageNumbers = React.memo<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}>(({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = useMemo(() => {
    const pages = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= showPages; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - showPages + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center gap-1">
      {pageNumbers.map(pageNum => (
        <Button
          key={pageNum}
          variant={currentPage === pageNum ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </Button>
      ))}
    </div>
  );
});

PageNumbers.displayName = 'PageNumbers';

export default function WeiboImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

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

  const handleToggleAllCurrentPage = useCallback(() => {
    const currentPagePaths = paginationData.paginatedFiles.map(file => file.path);
    const allCurrentPageSelected = currentPagePaths.every(path => selectedFiles.has(path));

    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (allCurrentPageSelected) {
        currentPagePaths.forEach(path => newSet.delete(path));
      } else {
        currentPagePaths.forEach(path => newSet.add(path));
      }
      return newSet;
    });
  }, [paginationData.paginatedFiles, selectedFiles]);

  const handleToggleAllFiles = useCallback(() => {
    const allFilteredPaths = filteredFiles.map(file => file.path);
    const allSelected = allFilteredPaths.every(path => selectedFiles.has(path));

    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        allFilteredPaths.forEach(path => newSet.delete(path));
      } else {
        allFilteredPaths.forEach(path => newSet.add(path));
      }
      return newSet;
    });
  }, [filteredFiles, selectedFiles]);

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

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // 平滑滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFilterTypeChange = useCallback((value: string) => {
    setFilterType(value as 'all' | 'image' | 'video' | 'gif');
  }, []);

  const handleFilterUserChange = useCallback((value: string) => {
    setFilterUser(value);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">微博文件导入</h1>
        <p className="text-gray-600">
          扫描并导入weibo-crawler下载的媒体文件
        </p>
      </div>

      {/* 扫描配置 */}
      <Card className="mb-6">
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
            disabled={isScanning || !session}
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>扫描结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="filterType">类型:</Label>
                  <Select value={filterType} onValueChange={handleFilterTypeChange}>
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
                  <Select value={filterUser} onValueChange={handleFilterUserChange}>
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

              {/* 选择控制 */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAllCurrentPage}
                >
                  {paginationData.paginatedFiles.every(file => selectedFiles.has(file.path)) ? '取消选择当前页' : '选择当前页'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAllFiles}
                >
                  {filteredFiles.every(file => selectedFiles.has(file.path)) ? '取消选择全部' : '选择全部'}
                </Button>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">第</span>
                    <Badge variant="outline">{currentPage}</Badge>
                    <span className="text-sm">页，共 {paginationData.totalPages} 页</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(paginationData.totalPages, currentPage + 1))}
                    disabled={currentPage === paginationData.totalPages}
                  >
                    下一页
                  </Button>
                </div>
              </div>

              {/* 批量上传按钮 */}
              <Button
                onClick={handleBatchUpload}
                disabled={selectedFiles.size === 0 || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    正在上传...
                  </>
                ) : (
                  `批量上传 (${selectedFiles.size} 个文件)`
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 性能提示 */}
          {filteredFiles.length > 50 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-800">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    性能提示
                  </Badge>
                  <span className="text-sm">
                    检测到大量文件({filteredFiles.length}个)，页面已自动优化图片加载以提升性能
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 文件网格 - 只显示当前页，使用优化组件 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
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

          {/* 分页控制 */}
          {paginationData.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                首页
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>

              <PageNumbers
                currentPage={currentPage}
                totalPages={paginationData.totalPages}
                onPageChange={handlePageChange}
              />

              <Button
                variant="outline"
                onClick={() => handlePageChange(Math.min(paginationData.totalPages, currentPage + 1))}
                disabled={currentPage === paginationData.totalPages}
              >
                下一页
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(paginationData.totalPages)}
                disabled={currentPage === paginationData.totalPages}
              >
                末页
              </Button>
            </div>
          )}
        </>
      )}

      {/* 上传结果 */}
      {uploadResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>上传结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
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
  );
}