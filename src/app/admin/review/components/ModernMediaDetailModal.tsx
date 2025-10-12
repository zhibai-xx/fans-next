'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Eye, Edit3, Check, AlertCircle, Play, Info, Clock, User, Hash, Folder } from 'lucide-react';
import { MediaItem } from '@/services/media.service';
import { ReviewService } from '@/services/review.service';
import { handleApiError } from '@/lib/utils/error-handler';
import RobustVideoPlayer from '@/components/video/RobustVideoPlayer';

interface ModernMediaDetailModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedMedia: MediaItem) => void;
}

interface CategoryOption {
  id: string;
  name: string;
  description?: string;
  media_count: number;
}

interface TagOption {
  id: string;
  name: string;
  created_at: string;
  usage_count: number;
}

// URL格式化函数
const formatVideoUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }

  const cleanUrl = url.trim();

  // 如果是绝对URL且指向后端3000端口，转换为相对路径
  if (cleanUrl.startsWith('http://localhost:3000/')) {
    const path = cleanUrl.replace('http://localhost:3000/', '');
    return `/${path}`;
  }

  // 如果已经是相对路径，直接返回
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }

  // 处理数据库存储的相对路径格式
  if (cleanUrl.startsWith('uploads/')) {
    const pathParts = cleanUrl.replace('uploads/', '');
    return `/api/upload/file/${pathParts}`;
  }

  return `/api/upload/file/${cleanUrl}`;
};

// 现代化视频播放器包装组件
const ModernVideoPlayerWrapper = React.memo(function ModernVideoPlayerWrapper({ media }: { media: MediaItem }) {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 准备视频源
  const videoSources = useMemo(() => {
    const sources = media.video_qualities && media.video_qualities.length > 0
      ? media.video_qualities.map(quality => {
        const formattedUrl = formatVideoUrl(quality.url);
        return {
          src: formattedUrl,
          type: 'video/mp4',
          label: quality.quality || `${quality.height}p`,
        };
      }).filter(source => source.src)
      : (() => {
        const formattedUrl = formatVideoUrl(media.url);
        return formattedUrl ? [{ src: formattedUrl, type: 'video/mp4', label: '原画' }] : [];
      })();

    return sources;
  }, [media.id, media.url, media.video_qualities]);

  const posterUrl = useMemo(() => formatVideoUrl(media.thumbnail_url), [media.thumbnail_url]);

  if (!isReady) {
    return (
      <div ref={containerRef} className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm">正在加载播放器...</p>
        </div>
      </div>
    );
  }

  if (videoSources.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">视频无法播放</h3>
          <p className="text-sm text-gray-500">视频文件可能已损坏或不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <RobustVideoPlayer
        key={`robust-video-${media.id}`}
        src={videoSources}
        poster={posterUrl}
        aspectRatio="auto"
        controls={true}
        autoplay={false}
        enableQualitySelector={videoSources.length > 1}
        className="w-full"
      />
    </div>
  );
}, (prevProps, nextProps) => prevProps.media.id === nextProps.media.id);

export function ModernMediaDetailModal({ media, isOpen, onClose, onUpdate }: ModernMediaDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE',
    tag_ids: [] as string[]
  });

  // 选项数据
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);

  // 初始化表单数据
  useEffect(() => {
    if (media) {
      setFormData({
        title: media.title || '',
        description: media.description || '',
        category_id: media.category?.id || '',
        status: media.status,
        tag_ids: media.media_tags?.map(tag => tag.tag.id) || []
      });
    }
  }, [media]);

  // 加载分类和标签数据
  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  const loadOptions = async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        ReviewService.getAllCategories(),
        ReviewService.getAllTags()
      ]);

      setCategories(categoriesData);
      setTags(tagsData);
    } catch (err) {
      console.error('加载选项数据失败:', err);
      setError(handleApiError(err, '加载数据失败'));
    }
  };

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleTagToggle = useCallback((tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  }, []);

  const handleSave = async () => {
    if (!media) return;

    setIsLoading(true);
    setError(null);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id && formData.category_id !== 'none' && formData.category_id.trim() !== ''
          ? formData.category_id
          : undefined,
        status: formData.status,
        tag_ids: formData.tag_ids
      };

      const updatedMedia = await ReviewService.updateMediaInfo(media.id, updateData);
      onUpdate(updatedMedia);
      setIsEditing(false);
    } catch (err) {
      console.error('保存媒体信息失败:', err);
      setError(handleApiError(err, '保存失败'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!media) return;

    setIsLoading(true);
    setError(null);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id && formData.category_id !== 'none' && formData.category_id.trim() !== ''
          ? formData.category_id
          : undefined,
        status: 'APPROVED' as const,
        tag_ids: formData.tag_ids
      };

      const updatedMedia = await ReviewService.updateMediaInfo(media.id, updateData);
      onUpdate(updatedMedia);
      onClose();
    } catch (err) {
      console.error('审核通过失败:', err);
      setError(handleApiError(err, '审核通过失败'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!media) return;

    setIsLoading(true);
    setError(null);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id && formData.category_id !== 'none' && formData.category_id.trim() !== ''
          ? formData.category_id
          : undefined,
        status: 'REJECTED' as const,
        tag_ids: formData.tag_ids
      };

      const updatedMedia = await ReviewService.updateMediaInfo(media.id, updateData);
      onUpdate(updatedMedia);
      onClose();
    } catch (err) {
      console.error('审核拒绝失败:', err);
      setError(handleApiError(err, '审核拒绝失败'));
    } finally {
      setIsLoading(false);
    }
  };

  // 判断是否可以编辑
  const canEdit = media?.status === 'PENDING';
  const canApprove = media?.status === 'PENDING';
  const canReject = media?.status === 'PENDING';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PRIVATE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED': return '已通过';
      case 'REJECTED': return '已拒绝';
      case 'PRIVATE': return '私有';
      default: return '待审核';
    }
  };

  if (!media) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {media.media_type === 'VIDEO' ? (
                  <Play className="h-5 w-5 text-blue-600" />
                ) : (
                  <Eye className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {isEditing ? '编辑媒体信息' : '媒体详情'}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  {isEditing ? '编辑媒体文件的详细信息和状态' : '查看媒体文件的详细信息'}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(formData.status)}>
                {getStatusText(formData.status)}
              </Badge>
              <Badge variant="outline">
                {media.media_type === 'IMAGE' ? '图片' : '视频'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {/* 媒体预览区域 */}
          <div className="space-y-6">
            {/* 主要预览 */}
            <Card className="overflow-visible">
              <CardContent className="p-0">
                {media.media_type === 'IMAGE' ? (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={media.thumbnail_url || media.url}
                      alt={media.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-black min-h-0">
                    {isOpen && <ModernVideoPlayerWrapper key={media.id} media={media} />}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 基本信息卡片 */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Info className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">文件大小</p>
                      <p className="font-medium">{(media.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">上传者</p>
                      <p className="font-medium">{media.user.username}</p>
                    </div>
                  </div>

                  {media.width && media.height && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Hash className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">尺寸</p>
                        <p className="font-medium">{media.width} × {media.height}</p>
                      </div>
                    </div>
                  )}

                  {media.duration && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">时长</p>
                        <p className="font-medium">
                          {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 编辑信息区域 */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* 标题 */}
                <div>
                  <Label htmlFor="title" className="text-base font-medium">标题</Label>
                  {isEditing && canEdit ? (
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="请输入标题"
                      className="mt-2"
                    />
                  ) : (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{formData.title || '无标题'}</p>
                    </div>
                  )}
                </div>

                {/* 描述 */}
                <div>
                  <Label htmlFor="description" className="text-base font-medium">描述</Label>
                  {isEditing && canEdit ? (
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="请输入描述"
                      rows={4}
                      className="mt-2"
                    />
                  ) : (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg min-h-[100px]">
                      <p className="text-gray-900 whitespace-pre-wrap">{formData.description || '无描述'}</p>
                    </div>
                  )}
                </div>

                {/* 分类 */}
                <div>
                  <Label htmlFor="category" className="text-base font-medium">分类</Label>
                  {isEditing && canEdit ? (
                    <Select
                      value={formData.category_id || "none"}
                      onValueChange={(value) => handleInputChange('category_id', value === "none" ? "" : value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">无分类</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4" />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-gray-600" />
                        <p className="text-gray-900">{media.category?.name || '无分类'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 标签 */}
                <div>
                  <Label className="text-base font-medium">标签</Label>
                  {isEditing && canEdit ? (
                    <div className="mt-2 space-y-3">
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                        {tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant={formData.tag_ids.includes(tag.id) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => handleTagToggle(tag.id)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {media.media_tags?.length > 0 ? (
                        media.media_tags.map((mediaTag) => (
                          <Badge key={mediaTag.tag.id} variant="secondary">
                            {mediaTag.tag.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">无标签</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>

          <div className="flex gap-3">
            {!isEditing ? (
              <>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    编辑
                  </Button>
                )}
                {canReject && (
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isLoading}
                  >
                    拒绝
                  </Button>
                )}
                {canApprove && (
                  <Button
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    通过
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                    if (media) {
                      setFormData({
                        title: media.title || '',
                        description: media.description || '',
                        category_id: media.category?.id || '',
                        status: media.status,
                        tag_ids: media.media_tags?.map(tag => tag.tag.id) || []
                      });
                    }
                  }}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? '保存中...' : '保存'}
                </Button>
                {canApprove && (
                  <Button
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isLoading ? '处理中...' : '保存并通过'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
