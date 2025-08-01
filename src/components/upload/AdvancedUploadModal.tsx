'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
import { uploadService } from '@/services/upload.service';
import { formatFileSize } from '@/lib/utils/format';
import { UploadProgress } from './UploadProgress';
import type { UploadTask, Tag, Category } from '@/types/upload';

interface AdvancedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'image' | 'video' | 'both';
  onUploadComplete?: (mediaIds: string[]) => void;
}

interface FileWithMetadata {
  file: File;
  id: string;
  title: string;
  description: string;
  tags: string[];
  category?: Category;
  taskId?: string;
  // 为每个文件单独维护标签输入状态
  tagInput?: string;
  showTagDropdown?: boolean;
  filteredTags?: Tag[];
  // 新增：展开状态
  isExpanded?: boolean;
}

// 批量操作模板
interface BatchTemplate {
  description: string;
  tags: string[];
  category?: Category;
}

export const AdvancedUploadModal: React.FC<AdvancedUploadModalProps> = ({
  isOpen,
  onClose,
  type,
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    completed: number;
    failed: number;
    total: number;
  }>({ completed: 0, failed: 0, total: 0 });

  // 新增状态：交互模式和批量操作
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [batchTemplate, setBatchTemplate] = useState<BatchTemplate>({
    description: '',
    tags: [],
    category: undefined,
  });

  // 清除所有数据
  const clearAllData = useCallback(() => {
    setFiles([]);
    setUploadTasks([]);
    setIsUploading(false);
    setUploadResults({ completed: 0, failed: 0, total: 0 });
    setViewMode('compact');
    setShowBatchPanel(false);
    setBatchTemplate({ description: '', tags: [], category: undefined });

    // 清理fileUploader中的所有任务，防止累积
    fileUploader.clearCompletedTasks();
  }, []);

  // 每次打开 dialog 时清除数据
  useEffect(() => {
    if (isOpen) {
      clearAllData();
      // 重新获取标签和分类
      uploadService.getTags().then(res => setTags(res.tags || []));
      if (type === 'video' || type === 'both') {
        uploadService.getCategories().then(res => setCategories(res.categories || []));
      }
    }
  }, [isOpen, type, clearAllData]);

  // 更新上传任务状态
  useEffect(() => {
    const interval = setInterval(() => {
      if (isUploading) {
        const tasks = fileUploader.getAllTasks();
        setUploadTasks(tasks);

        // 修复统计逻辑：区分真正成功上传和跳过的文件
        const actuallyCompletedTasks = tasks.filter(task => task.status === 'completed');
        const skippedTasks = tasks.filter(task => task.status === 'skipped');
        const failedTasks = tasks.filter(task => task.status === 'failed');
        const totalTasks = tasks.length;

        setUploadResults({
          completed: actuallyCompletedTasks.length, // 只计算真正成功的任务
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
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isUploading, onUploadComplete]);

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
      setFiles(prev => [...prev, ...newFiles]);

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

  // 更新文件元数据
  const updateFileMetadata = useCallback((fileId: string, updates: Partial<FileWithMetadata>) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, ...updates } : f
    ));
  }, []);

  // 删除文件
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    // 如果有对应的上传任务，取消它
    const file = files.find(f => f.id === fileId);
    if (file?.taskId) {
      fileUploader.cancelUpload(file.taskId);
    }
  }, [files]);

  // 切换文件展开状态
  const toggleFileExpanded = useCallback((fileId: string) => {
    updateFileMetadata(fileId, {
      isExpanded: !files.find(f => f.id === fileId)?.isExpanded
    });
  }, [files, updateFileMetadata]);

  // 批量应用模板
  const applyBatchTemplate = useCallback(() => {
    setFiles(prev => prev.map(file => ({
      ...file,
      description: file.description || batchTemplate.description,
      tags: [...new Set([...file.tags, ...batchTemplate.tags])],
      category: file.category || batchTemplate.category,
    })));
    setShowBatchPanel(false);
  }, [batchTemplate]);

  // 复制第一个文件的设置到其他文件
  const copyFirstFileSettings = useCallback(() => {
    const firstFile = files[0];
    if (!firstFile) return;

    setFiles(prev => prev.map((file, index) =>
      index === 0 ? file : {
        ...file,
        description: firstFile.description,
        tags: [...firstFile.tags],
        category: firstFile.category,
      }
    ));
  }, [files]);

  // 全部展开/折叠
  const toggleAllExpanded = useCallback((expanded: boolean) => {
    setFiles(prev => prev.map(file => ({ ...file, isExpanded: expanded })));
  }, []);

  // 添加标签到文件
  const addTagToFile = useCallback((fileId: string, tagName: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && !file.tags.includes(tagName)) {
      updateFileMetadata(fileId, {
        tags: [...file.tags, tagName]
      });
    }
  }, [files, updateFileMetadata]);

  // 从文件移除标签
  const removeTagFromFile = useCallback((fileId: string, tagName: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      updateFileMetadata(fileId, {
        tags: file.tags.filter(tag => tag !== tagName)
      });
    }
  }, [files, updateFileMetadata]);

  // 更新标签输入状态
  const updateTagInput = useCallback((fileId: string, value: string) => {
    const filtered = tags.filter(tag =>
      tag.name.toLowerCase().includes(value.toLowerCase())
    );

    updateFileMetadata(fileId, {
      tagInput: value,
      filteredTags: filtered,
      showTagDropdown: value.trim() !== '' && filtered.length > 0
    });
  }, [tags, updateFileMetadata]);

  // 创建新标签
  const createTag = async (tagName: string) => {
    try {
      const response = await uploadService.createTag({ name: tagName });
      setTags(prev => [...prev, response.tag]);
      return response.tag;
    } catch (error) {
      console.error('创建标签失败:', error);
      return null;
    }
  };

  // 开始上传
  const startUpload = async () => {
    setIsUploading(true);
    setUploadResults({ completed: 0, failed: 0, total: files.length });

    for (const fileData of files) {
      if (!fileData.taskId) {
        const options: ExtendedUploadOptions = {
          file: fileData.file,
          title: fileData.title,
          description: fileData.description,
          tags: fileData.tags,
          category: fileData.category,
          onProgress: (progress) => {
            console.log(`文件 ${fileData.title} 上传进度: ${progress}%`);
          },
          onComplete: (mediaId) => {
            console.log(`文件 ${fileData.title} 上传完成: ${mediaId}`);
          },
          onError: (error) => {
            console.error(`文件 ${fileData.title} 上传失败:`, error);
            // 特殊处理文件已存在的情况
            if (error.includes('文件已存在') || error.includes('Unique constraint') || error.includes('P2002')) {
              console.log(`文件 ${fileData.title} 已存在，标记为完成`);
            }
          },
          onStatusChange: (status) => {
            console.log(`文件 ${fileData.title} 状态变化: ${status}`);
          },
        };

        const taskId = await fileUploader.createUploadTask(options);
        updateFileMetadata(fileData.id, { taskId });
      }
    }
  };

  // 获取文件对应的上传任务
  const getFileTask = (fileId: string): UploadTask | undefined => {
    const file = files.find(f => f.id === fileId);
    if (file?.taskId) {
      return uploadTasks.find(task => task.id === file.taskId);
    }
    return undefined;
  };

  // 渲染标签选择器
  const renderTagSelector = (fileData: FileWithMetadata) => {
    const { id: fileId, tagInput = '', showTagDropdown = false, filteredTags = [] } = fileData;

    return (
      <div className="space-y-2">
        <Label>标签</Label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="relative">
                <Input
                  value={tagInput}
                  onChange={(e) => updateTagInput(fileId, e.target.value)}
                  onFocus={() => {
                    if (tagInput.trim() && filteredTags.length > 0) {
                      updateFileMetadata(fileId, { showTagDropdown: true });
                    }
                  }}
                  onBlur={() => {
                    // 延时关闭下拉框，避免点击选项时立即关闭
                    setTimeout(() => {
                      updateFileMetadata(fileId, { showTagDropdown: false });
                    }, 150);
                  }}
                  placeholder="搜索或创建标签"
                  className="pr-8"
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              </div>

              {/* 标签下拉列表 */}
              {showTagDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                  {filteredTags.map(tag => (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      onClick={() => {
                        addTagToFile(fileId, tag.name);
                        updateFileMetadata(fileId, {
                          tagInput: '',
                          showTagDropdown: false
                        });
                      }}
                      className="w-full justify-between h-auto p-3 text-sm"
                    >
                      <span className="text-gray-700">{tag.name}</span>
                      <span className="text-xs text-gray-500">已存在</span>
                    </Button>
                  ))}
                  {filteredTags.length === 0 && tagInput.trim() && (
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        const newTag = await createTag(tagInput.trim());
                        if (newTag) {
                          addTagToFile(fileId, newTag.name);
                        }
                        updateFileMetadata(fileId, {
                          tagInput: '',
                          showTagDropdown: false
                        });
                      }}
                      className="w-full justify-start h-auto p-3 text-sm gap-2"
                    >
                      <Plus size={14} className="text-blue-500" />
                      <span className="text-gray-700">创建新标签 &quot;{tagInput.trim()}&quot;</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 已选择的标签 */}
          {fileData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {fileData.tags.map(tagName => (
                <Badge
                  key={tagName}
                  variant="secondary"
                  className="text-xs"
                >
                  {tagName}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTagFromFile(fileId, tagName)}
                    className="ml-1 h-auto w-auto p-0 text-blue-500 hover:text-blue-700"
                  >
                    <X size={10} />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染详细编辑表单
  const renderDetailedForm = (fileData: FileWithMetadata) => {
    const task = getFileTask(fileData.id);
    const isVideo = fileData.file.type.startsWith('video/');

    return (
      <div className="pt-4 space-y-4">
        {/* 标题 */}
        <div>
          <Label htmlFor={`title-${fileData.id}`}>标题</Label>
          <Input
            id={`title-${fileData.id}`}
            value={fileData.title}
            onChange={(e) => updateFileMetadata(fileData.id, { title: e.target.value })}
            placeholder="输入文件标题"
          />
        </div>

        {/* 描述 */}
        <div>
          <Label htmlFor={`description-${fileData.id}`}>描述</Label>
          <Textarea
            id={`description-${fileData.id}`}
            value={fileData.description}
            onChange={(e) => updateFileMetadata(fileData.id, { description: e.target.value })}
            rows={2}
            placeholder="输入文件描述（可选）"
          />
        </div>

        {/* 分类选择（仅视频） */}
        {isVideo && categories.length > 0 && (
          <div>
            <Label>分类</Label>
            <Select
              value={fileData.category?.id || ''}
              onValueChange={(value) => {
                const category = categories.find(c => c.id === value);
                updateFileMetadata(fileData.id, { category });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
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

        {/* 标签选择 */}
        {renderTagSelector(fileData)}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {type === 'image' ? '上传图片' : type === 'video' ? '上传视频' : '上传文件'}
            </DialogTitle>
            <DialogDescription>
              {type === 'image' ? '支持 JPG、PNG、GIF 等图片格式' :
                type === 'video' ? '支持 MP4、AVI、MOV 等视频格式' :
                  '支持图片和视频格式'}
            </DialogDescription>
          </DialogHeader>

          {/* 内容区域 */}
          <div className="flex-1 overflow-hidden">
            <div className="p-6 h-full flex flex-col">
              {/* 文件拖放区域 */}
              {!isUploading && (
                <Card
                  {...getRootProps()}
                  className={`cursor-pointer transition-all duration-200 mb-6 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <CardContent className="p-6 text-center">
                    <input {...getInputProps()} />
                    <Upload className="mx-auto mb-3 text-gray-400" size={36} />
                    <p className="text-lg text-gray-700 mb-2 font-medium">
                      拖拽文件到此处或点击选择
                    </p>
                    <p className="text-sm text-gray-500">
                      支持多文件批量上传
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 上传状态汇总 */}
              {isUploading && (
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="text-green-500" size={18} />
                          <span className="text-sm font-medium text-gray-700">
                            成功: {uploadResults.completed}
                          </span>
                        </div>
                        {uploadTasks.filter(task => task.status === 'skipped').length > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="text-yellow-500" size={18} />
                            <span className="text-sm font-medium text-gray-700">
                              跳过: {uploadTasks.filter(task => task.status === 'skipped').length}
                            </span>
                          </div>
                        )}
                        {uploadResults.failed > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="text-red-500" size={18} />
                            <span className="text-sm font-medium text-gray-700">
                              失败: {uploadResults.failed}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        进度: {uploadResults.completed + uploadResults.failed + uploadTasks.filter(task => task.status === 'skipped').length}/{uploadResults.total}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 文件列表和操作区域 */}
              {files.length > 0 && (
                <div className="flex-1 min-h-0 flex flex-col">
                  {/* 文件列表头部操作 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        文件列表 ({files.length})
                      </h3>

                      {/* 视图模式切换 */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'compact' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('compact')}
                        >
                          <Zap size={14} className="mr-1" />
                          快速模式
                        </Button>
                        <Button
                          variant={viewMode === 'detailed' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('detailed')}
                        >
                          <Edit3 size={14} className="mr-1" />
                          详细编辑
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 批量操作按钮 */}
                      {files.length > 1 && !isUploading && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBatchPanel(!showBatchPanel)}
                          >
                            批量设置
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyFirstFileSettings}
                          >
                            <Copy size={14} className="mr-1" />
                            复制首个
                          </Button>
                        </>
                      )}

                      {/* 展开/折叠按钮 */}
                      {viewMode === 'detailed' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAllExpanded(true)}
                          >
                            全部展开
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAllExpanded(false)}
                          >
                            全部折叠
                          </Button>
                        </div>
                      )}

                      {!isUploading && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllData}
                        >
                          清空所有
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 批量操作面板 */}
                  {showBatchPanel && (
                    <Card className="bg-yellow-50 border-yellow-200 mb-4">
                      <CardHeader>
                        <CardTitle className="text-sm">批量设置</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="batch-description">通用描述</Label>
                            <Input
                              id="batch-description"
                              value={batchTemplate.description}
                              onChange={(e) => setBatchTemplate(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="为所有文件设置相同描述"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={applyBatchTemplate}
                              className="bg-yellow-500 hover:bg-yellow-600"
                            >
                              应用到所有文件
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowBatchPanel(false)}
                            >
                              取消
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 文件列表滚动区域 - 基于实际可用空间设置高度 */}
                  <div
                    className="overflow-y-auto border border-gray-200 rounded-lg p-2"
                    style={{
                      maxHeight: '280px', // 基于用户测试，288px以内可正常显示
                      minHeight: '200px'  // 确保最小可用空间
                    }}
                  >
                    <div className="space-y-3">
                      {files.map((fileData) => {
                        const task = getFileTask(fileData.id);
                        const isVideo = fileData.file.type.startsWith('video/');
                        const isExpanded = viewMode === 'detailed' ? fileData.isExpanded : false;

                        return (
                          <Card key={fileData.id} className="shadow-sm">
                            {/* 文件头部信息 */}
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {/* 文件图标 */}
                                <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                                  {isVideo ? (
                                    <FileVideo className="text-purple-500" size={20} />
                                  ) : (
                                    <FileImage className="text-blue-500" size={20} />
                                  )}
                                </div>

                                {/* 文件信息 */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900 truncate text-sm">{fileData.file.name}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {formatFileSize(fileData.file.size)}
                                    </Badge>
                                  </div>

                                  {/* 快速模式下显示标题输入 */}
                                  {viewMode === 'compact' && !isUploading && (
                                    <Input
                                      value={fileData.title}
                                      onChange={(e) => updateFileMetadata(fileData.id, { title: e.target.value })}
                                      className="mt-2"
                                      placeholder="输入文件标题"
                                    />
                                  )}
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex items-center gap-2">
                                  {viewMode === 'detailed' && !isUploading && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleFileExpanded(fileData.id)}
                                    >
                                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </Button>
                                  )}

                                  {!isUploading && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(fileData.id)}
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <X size={16} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>

                            {/* 详细编辑区域 - 可展开 */}
                            {isExpanded && !isUploading && (
                              <CardContent className="px-4 pb-4 border-t border-gray-100">
                                {renderDetailedForm(fileData)}
                              </CardContent>
                            )}

                            {/* 上传进度显示 */}
                            {task && (
                              <CardContent className="px-4 pb-4">
                                <UploadProgress
                                  task={task}
                                  onRetry={() => {
                                    if (fileData.taskId) {
                                      const options: ExtendedUploadOptions = {
                                        file: fileData.file,
                                        title: fileData.title,
                                        description: fileData.description,
                                        tags: fileData.tags,
                                        category: fileData.category,
                                      };
                                      fileUploader.retryUpload(fileData.taskId, options);
                                    }
                                  }}
                                  onCancel={() => {
                                    if (fileData.taskId) {
                                      fileUploader.cancelUpload(fileData.taskId);
                                    }
                                  }}
                                />
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-b-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>共 {files.length} 个文件</span>
              {uploadResults.total > 0 && (
                <span>• 完成 {uploadResults.completed}/{uploadResults.total}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  // 强制清理所有状态和任务
                  clearAllData();
                  onClose();
                }}
                variant="outline"
                disabled={isUploading}
              >
                关闭
              </Button>

              <Button
                onClick={startUpload}
                disabled={files.length === 0 || isUploading}
                className="px-6"
              >
                {isUploading ? '上传中...' : `开始上传 (${files.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 