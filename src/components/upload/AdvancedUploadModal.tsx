'use client';

import React, { useCallback, useEffect } from 'react';
import { Upload, X, FileImage, FileVideo, Search, Plus, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Copy, Edit3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDropzone } from 'react-dropzone';
import { fileUploader, ExtendedUploadOptions } from '@/lib/upload/file-uploader';
import { formatFileSize } from '@/lib/utils/format';
import { UploadProgress } from './UploadProgress';
import { useUploadStore } from '@/store/upload.store';
import { useUserTags, useUserCategories } from '@/hooks/queries/useUserMedia';
import type { UploadTask, Tag, Category, FileWithMetadata } from '@/types/upload';

interface AdvancedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'image' | 'video' | 'both';
  onUploadComplete?: (mediaIds: string[]) => void;
}

export default function AdvancedUploadModal({
  isOpen,
  onClose,
  type,
  onUploadComplete
}: AdvancedUploadModalProps) {
  // 使用Zustand store管理状态
  const {
    files,
    uploadTasks,
    isUploading,
    uploadResults,
    viewMode,
    showBatchPanel,
    batchTemplate,
    tags,
    categories,
    addFiles,
    removeFile,
    updateFileMetadata,
    setUploadTasks,
    setIsUploading,
    setUploadResults,
    clearAllData,
    setViewMode,
    setShowBatchPanel,
    setBatchTemplate,
    applyBatchTemplate,
    setTags,
    setCategories
  } = useUploadStore();

  // 使用TanStack Query获取标签和分类数据
  const { data: tagsData } = useUserTags();
  const { data: categoriesData } = useUserCategories();

  // 同步标签和分类到store
  useEffect(() => {
    if (tagsData) {
      setTags(tagsData);
    }
  }, [tagsData, setTags]);

  useEffect(() => {
    if (categoriesData && (type === 'video' || type === 'both')) {
      setCategories(categoriesData);
    }
  }, [categoriesData, type, setCategories]);

  // 清理数据当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      // 清理fileUploader中的所有任务，防止累积
      fileUploader.clearCompletedTasks();
    }
  }, [isOpen]);

  // 更新上传任务状态
  useEffect(() => {
    if (!isUploading) return;

    const interval = setInterval(() => {
      const tasks = fileUploader.getAllTasks();
      setUploadTasks(tasks);

      // 修复统计逻辑：区分真正成功上传和跳过的文件
      const actuallyCompletedTasks = tasks.filter(task => task.status === 'completed');
      const skippedTasks = tasks.filter(task => task.status === 'skipped');
      const failedTasks = tasks.filter(task => task.status === 'failed');
      const totalTasks = tasks.length;

      setUploadResults({
        completed: actuallyCompletedTasks.length,
        failed: failedTasks.length,
        total: totalTasks
      });

      // 检查是否所有任务都已完成
      const allCompleted = tasks.every(task =>
        task.status === 'completed' || task.status === 'skipped' || task.status === 'failed' || task.status === 'cancelled'
      );

      if (allCompleted && tasks.length > 0) {
        setIsUploading(false);

        // 修复回调逻辑：区分实际成功和跳过的文件
        if (actuallyCompletedTasks.length > 0) {
          const mediaIds = actuallyCompletedTasks.map(task => task.mediaId!).filter(Boolean);
          onUploadComplete?.(mediaIds);
        } else if (skippedTasks.length > 0 && actuallyCompletedTasks.length === 0) {
          // 如果所有文件都是跳过的（文件已存在），传递空数组
          onUploadComplete?.([]);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isUploading, onUploadComplete, setUploadTasks, setUploadResults, setIsUploading]);

  // 文件拖放配置
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: type === 'image'
      ? { 'image/*': [] }
      : type === 'video'
        ? { 'video/*': [] }
        : { 'image/*': [], 'video/*': [] },
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        tags: [],
        category: undefined,
        tagInput: '',
        showTagDropdown: false,
        filteredTags: [],
        isExpanded: false,
      }));
      addFiles(newFiles);

      // 如果只有一个文件，自动展开
      if (newFiles.length === 1) {
        setViewMode('detailed');
        newFiles[0].isExpanded = true;
      }

      // 如果上传多个文件，显示批量操作面板
      if (newFiles.length > 1) {
        setShowBatchPanel(true);
      }
    },
  });

  // 删除文件处理
  const handleRemoveFile = useCallback((fileId: string) => {
    // 如果有对应的上传任务，取消它
    const file = files.find(f => f.id === fileId);
    if (file?.taskId) {
      fileUploader.cancelUpload(file.taskId);
    }
    removeFile(fileId);
  }, [files, removeFile]);

  // 切换文件展开状态
  const toggleFileExpanded = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      updateFileMetadata(fileId, {
        isExpanded: !file.isExpanded
      });
    }
  }, [files, updateFileMetadata]);

  // 标签输入处理
  const handleTagInput = useCallback((fileId: string, input: string) => {
    updateFileMetadata(fileId, {
      tagInput: input,
      showTagDropdown: input.length > 0,
      filteredTags: tags.filter(tag =>
        tag.name.toLowerCase().includes(input.toLowerCase())
      )
    });
  }, [tags, updateFileMetadata]);

  // 添加标签
  const addTag = useCallback((fileId: string, tagName: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && !file.tags.some(t => t.name === tagName)) {
      const tag = tags.find(t => t.name === tagName) || { id: `temp-${Date.now()}`, name: tagName };
      updateFileMetadata(fileId, {
        tags: [...file.tags, tag],
        tagInput: '',
        showTagDropdown: false,
        filteredTags: []
      });
    }
  }, [files, tags, updateFileMetadata]);

  // 移除标签
  const removeTag = useCallback((fileId: string, tagName: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      updateFileMetadata(fileId, {
        tags: file.tags.filter(t => t.name !== tagName)
      });
    }
  }, [files, updateFileMetadata]);

  // 开始上传
  const startUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // 为每个文件创建上传任务
    const uploadPromises = files.map(async (fileData) => {
      const options: ExtendedUploadOptions = {
        file: fileData.file,
        title: fileData.title,
        description: fileData.description,
        tags: fileData.tags.map(tag => tag.name),
        category: fileData.category,
        onProgress: (progress) => {
          // 进度更新会通过useEffect监听任务状态变化来处理
        }
      };

      try {
        const taskId = await fileUploader.createUploadTask(options);
        // 更新文件的taskId
        updateFileMetadata(fileData.id, { taskId });
        return taskId;
      } catch (error) {
        console.error(`上传文件 ${fileData.file.name} 失败:`, error);
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('批量上传失败:', error);
      setIsUploading(false);
    }
  }, [files, setIsUploading, updateFileMetadata]);

  // 关闭模态框
  const handleClose = useCallback(() => {
    if (isUploading) {
      const confirmClose = window.confirm('正在上传中，确定要关闭吗？这将取消所有上传任务。');
      if (!confirmClose) return;

      // 取消所有上传任务
      uploadTasks.forEach(task => {
        if (task.id) {
          fileUploader.cancelUpload(task.id);
        }
      });
    }

    clearAllData();
    onClose();
  }, [isUploading, uploadTasks, clearAllData, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            高级上传 - {type === 'image' ? '图片' : type === 'video' ? '视频' : '图片和视频'}
          </DialogTitle>
          <DialogDescription>
            拖拽文件到此处或点击选择文件，支持批量上传和元数据编辑
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* 文件拖放区域 */}
          {files.length === 0 && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isDragActive ? '释放文件开始上传' : '拖拽文件到此处'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                或者 <span className="text-blue-500 underline">点击选择文件</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                支持 {type === 'image' ? '图片格式' : type === 'video' ? '视频格式' : '图片和视频格式'}
              </p>
            </div>
          )}

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="space-y-4">
              {/* 批量操作面板 */}
              {showBatchPanel && files.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      批量操作
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBatchPanel(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="batch-description">批量描述</Label>
                      <Textarea
                        id="batch-description"
                        placeholder="为所有文件设置相同的描述..."
                        value={batchTemplate.description}
                        onChange={(e) => setBatchTemplate({ ...batchTemplate, description: e.target.value })}
                      />
                    </div>

                    {(type === 'video' || type === 'both') && (
                      <div>
                        <Label htmlFor="batch-category">批量分类</Label>
                        <Select
                          value={batchTemplate.category?.id}
                          onValueChange={(value) => {
                            const category = categories.find(c => c.id === value);
                            setBatchTemplate({ ...batchTemplate, category });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择分类..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button
                      onClick={applyBatchTemplate}
                      className="w-full"
                      variant="outline"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      应用到所有文件
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 文件项列表 */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {files.map((fileData) => (
                  <Card key={fileData.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* 文件图标和信息 */}
                        <div className="flex-shrink-0">
                          {fileData.file.type.startsWith('image/') ? (
                            <FileImage className="h-8 w-8 text-blue-500" />
                          ) : (
                            <FileVideo className="h-8 w-8 text-purple-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* 文件基本信息 */}
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm truncate">
                              {fileData.file.name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(fileData.file.size)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFileExpanded(fileData.id)}
                              className="ml-auto"
                            >
                              {fileData.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          {/* 展开的编辑区域 */}
                          {fileData.isExpanded && (
                            <div className="space-y-3 pt-2 border-t">
                              {/* 标题 */}
                              <div>
                                <Label htmlFor={`title-${fileData.id}`}>标题</Label>
                                <Input
                                  id={`title-${fileData.id}`}
                                  value={fileData.title}
                                  onChange={(e) => updateFileMetadata(fileData.id, { title: e.target.value })}
                                  placeholder="输入文件标题..."
                                />
                              </div>

                              {/* 描述 */}
                              <div>
                                <Label htmlFor={`description-${fileData.id}`}>描述</Label>
                                <Textarea
                                  id={`description-${fileData.id}`}
                                  value={fileData.description}
                                  onChange={(e) => updateFileMetadata(fileData.id, { description: e.target.value })}
                                  placeholder="输入文件描述..."
                                  rows={2}
                                />
                              </div>

                              {/* 标签 */}
                              <div>
                                <Label>标签</Label>
                                <div className="space-y-2">
                                  {/* 已选标签 */}
                                  {fileData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {fileData.tags.map((tag) => (
                                        <Badge
                                          key={tag.name}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {tag.name}
                                          <button
                                            onClick={() => removeTag(fileData.id, tag.name)}
                                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  {/* 标签输入 */}
                                  <div className="relative">
                                    <Input
                                      placeholder="输入标签名称..."
                                      value={fileData.tagInput}
                                      onChange={(e) => handleTagInput(fileData.id, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && fileData.tagInput.trim()) {
                                          e.preventDefault();
                                          addTag(fileData.id, fileData.tagInput.trim());
                                        }
                                      }}
                                    />

                                    {/* 标签下拉建议 */}
                                    {fileData.showTagDropdown && fileData.filteredTags.length > 0 && (
                                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-32 overflow-y-auto">
                                        {fileData.filteredTags.map((tag) => (
                                          <button
                                            key={tag.id}
                                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => addTag(fileData.id, tag.name)}
                                          >
                                            {tag.name}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 分类（仅视频） */}
                              {(type === 'video' || type === 'both') && (
                                <div>
                                  <Label htmlFor={`category-${fileData.id}`}>分类</Label>
                                  <Select
                                    value={fileData.category?.id || ''}
                                    onValueChange={(value) => {
                                      const category = categories.find(c => c.id === value);
                                      updateFileMetadata(fileData.id, { category });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="选择分类..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categories.map(category => (
                                        <SelectItem key={category.id} value={category.id}>
                                          {category.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 删除按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(fileData.id)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 添加更多文件 */}
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <input {...getInputProps()} />
                <Plus className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  添加更多文件
                </p>
              </div>
            </div>
          )}

          {/* 上传进度 */}
          {isUploading && (
            <div className="mt-4">
              <UploadProgress
                tasks={uploadTasks}
                results={uploadResults}
              />
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {files.length > 0 && (
              <span>{files.length} 个文件待上传</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              {isUploading ? '上传中...' : '取消'}
            </Button>

            {files.length > 0 && (
              <Button
                onClick={startUpload}
                disabled={isUploading}
                className="min-w-[100px]"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    开始上传
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}