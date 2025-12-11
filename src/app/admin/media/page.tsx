'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { resolveMediaImageUrl } from '@/lib/utils/media-url';
import { buildVideoSources, getPosterUrl, getVideoContainerStyle } from '@/lib/utils/video-sources';
import RobustVideoPlayer from '@/components/video/RobustVideoPlayer';
import {
  Search,
  CheckSquare,
  Square,
  Edit,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Video,
  Calendar,
  User,
  Tag as TagIcon,
  FolderOpen,
  Folder,
  Eye,
  EyeOff,
  Play,
  BarChart3,
  RefreshCw,
  MessageSquare,
  Hash,
  Save
} from 'lucide-react';
import { AdminMediaService, type Media, type MediaFilters, type Tag, type Category } from '@/services/admin-media.service';
import {
  useInfiniteMedia,
  useMediaStats,
  useUpdateMediaVisibilityMutation,
  useBatchUpdateMediaVisibilityMutation,
  useUpdateMediaInfoMutation,
  useDeleteMediaMutation,
  useBatchDeleteMediaMutation
} from '@/hooks/queries/useMedia';
import { queryUtils } from '@/lib/query-client';
import { useIntersectionObserverLegacy } from '@/hooks/useIntersectionObserver';

const isDev = process.env.NODE_ENV !== 'production';

// 视频播放器包装组件 - 完全复制审核管理页面的实现


// 管理页面视频播放器组件 - 与审核页面共用逻辑
function AdminVideoPlayerWrapper({ media }: { media: any }) {
  const videoSources = React.useMemo(
    () => buildVideoSources(media, { isAuthenticated: true }),
    [media],
  );

  const posterUrl = getPosterUrl(media);
  const containerStyle = React.useMemo(
    () => getVideoContainerStyle(media),
    [media],
  );

  if (videoSources.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">⚠️</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">视频无法播放</h3>
          <p className="text-sm text-gray-500">视频文件可能已损坏或不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-lg overflow-hidden" style={containerStyle}>
      <RobustVideoPlayer
        key={`admin-robust-video-${media.id}`}
        src={videoSources}
        poster={posterUrl}
        aspectRatio="auto"
        controls
        autoplay={false}
        enableQualitySelector={videoSources.length > 1}
        className="w-full h-full"
      />
    </div>
  );
}

// 文件大小格式化函数
const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// 虚拟化网格项组件
const MediaGridItem = React.memo(({
  media,
  isSelected,
  onToggleSelect,
  onPreview,
  onVisibilityUpdate,
  onEdit,
  onDelete
}: {
  media: Media;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (media: Media) => void;
  onVisibilityUpdate: (id: string, visibility: 'VISIBLE' | 'HIDDEN') => void;
  onEdit: (media: Media) => void;
  onDelete: (id: string) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const visibilityConfig = useMemo(() => {
    const visibilityMap = {
      VISIBLE: { variant: 'default' as const, icon: Eye, text: '显示', color: 'text-green-600' },
      HIDDEN: { variant: 'outline' as const, icon: EyeOff, text: '隐藏', color: 'text-gray-600' }
    };
    return visibilityMap[media.visibility] || visibilityMap.VISIBLE;
  }, [media.visibility]);



  const formatDuration = useCallback((seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // YouTube风格的智能缩略图样式
  const getVideoThumbnailClass = useCallback((): string => {
    // 🎯 统一使用16:9容器，让所有视频缩略图保持一致的外观
    return 'aspect-video bg-gray-100 flex items-center justify-center';
  }, []);

  const VisibilityIcon = visibilityConfig.icon;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border border-gray-200">
      {/* 选择复选框 */}
      <div className="absolute top-2 left-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
          onClick={() => onToggleSelect(media.id)}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 媒体预览区域 - 根据媒体类型和尺寸动态调整 */}
      <div
        className={`relative cursor-pointer overflow-hidden ${getVideoThumbnailClass()}`}
        onClick={() => onPreview(media)}
      >
        {media.media_type === 'IMAGE' ? (
          <>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {!imageError && (
              <Image
                  src={resolveMediaImageUrl(media.thumbnail_url || media.url)}
                alt={media.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            )}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">图片加载失败</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {media.thumbnail_url && !imageError ? (
              <>
                <Image
                  src={resolveMediaImageUrl(media.thumbnail_url)}
                  alt={media.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={`object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-3">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">视频预览</p>
                </div>
              </div>
            )}
            {/* 视频时长和比例标识 */}
            <div className="absolute bottom-2 right-2 flex flex-col items-end space-y-1">
              {/* 视频比例指示器 */}
              {media.width && media.height && (() => {
                const ratio = media.width / media.height;
                let ratioText = '';
                let ratioIcon = null;

                // 🎯 使用比例数值替代横屏/竖屏/方形的旧区分方式
                ratioText = `${ratio.toFixed(2)}`;
                ratioIcon = <div className="w-2.5 h-2.5 bg-current rounded-sm" />;

                return (
                  <div className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm flex items-center space-x-1">
                    {ratioIcon}
                    <span>{ratioText}</span>
                  </div>
                );
              })()}

              {/* 视频时长 */}
              {media.duration && (
                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm font-medium">
                  {formatDuration(media.duration)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 悬停操作按钮 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(media);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(media.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 媒体信息 */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 标题和状态 */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1">
              {media.title}
            </h3>
            <Badge
              variant={visibilityConfig.variant}
              className={`shrink-0 text-xs ${media.visibility === 'VISIBLE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
            >
              <VisibilityIcon className="w-3 h-3 mr-1" />
              {visibilityConfig.text}
            </Badge>
          </div>

          {/* 用户信息 */}
          <div className="flex items-center text-xs text-gray-600">
            <User className="w-3 h-3 mr-1.5 text-gray-400" />
            <span className="font-medium">{media.user.username}</span>
            {media.category && (
              <>
                <span className="mx-2 text-gray-300">•</span>
                <FolderOpen className="w-3 h-3 mr-1 text-gray-400" />
                <span>{media.category.name}</span>
              </>
            )}
          </div>

          {/* 统计信息网格 - 重新设计为2x2网格 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
              <span className="text-gray-500">大小</span>
              <span className="font-medium text-gray-900">{formatFileSize(media.size)}</span>
            </div>
            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-2.5 py-1.5">
              <span className="text-blue-600">查看</span>
              <span className="font-medium text-blue-700">{media.views}</span>
            </div>
            <div className="flex items-center justify-between bg-red-50 rounded-lg px-2.5 py-1.5">
              <span className="text-red-600">点赞</span>
              <span className="font-medium text-red-700">{media.likes_count}</span>
            </div>
            <div className="flex items-center justify-between bg-amber-50 rounded-lg px-2.5 py-1.5">
              <span className="text-amber-600">收藏</span>
              <span className="font-medium text-amber-700">{media.favorites_count || 0}</span>
            </div>
          </div>

          {/* 创建时间 */}
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1.5 text-gray-400" />
            <span>{new Date(media.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>

          {/* 标签 */}
          {media.media_tags && media.media_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {media.media_tags.slice(0, 3).map((mediaTag) => (
                <Badge
                  key={mediaTag.tag.id}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-0 hover:bg-blue-100"
                >
                  #{mediaTag.tag.name}
                </Badge>
              ))}
              {media.media_tags && media.media_tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-0"
                >
                  +{media.media_tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 h-8 text-xs font-medium transition-all duration-200 ${media.visibility === 'VISIBLE'
                ? 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
                }`}
              onClick={() => onVisibilityUpdate(
                media.id,
                media.visibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE'
              )}
            >
              {media.visibility === 'VISIBLE' ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1.5" />
                  隐藏
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1.5" />
                  显示
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 transition-all duration-200"
              onClick={() => onEdit(media)}
            >
              <Edit className="w-3 h-3 mr-1.5" />
              编辑
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MediaGridItem.displayName = 'MediaGridItem';

// 编辑对话框组件
interface MediaEditDialogProps {
  isOpen: boolean;
  media: Media | null;
  onClose: () => void;
  onSave: (editData: {
    title: string;
    description: string;
    tagIds: string[];
    categoryId: string;
  }) => void;
}

const MediaEditDialog: React.FC<MediaEditDialogProps> = ({ isOpen, media, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tagIds: [] as string[],
    categoryId: ''
  });
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (media) {
      setFormData({
        title: media.title || '',
        description: media.description || '',
        tagIds: media.media_tags?.map(mt => mt.tag.id) || [],
        categoryId: media.category_id || 'none'
      });
    }
  }, [media]);

  // 加载标签和分类数据
  useEffect(() => {
    if (isOpen) {
      loadTagsAndCategories();
    }
  }, [isOpen]);

  const loadTagsAndCategories = async () => {
    try {
      const [tagsResponse, categoriesResponse] = await Promise.all([
        AdminMediaService.getTagUsageStats(),
        AdminMediaService.getCategoryUsageStats()
      ]);

      if (tagsResponse.success) {
        setTags(tagsResponse.data || []);
      }
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }
    } catch (error) {
      console.error('加载标签和分类失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!media) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="border-b border-gray-100 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            编辑媒体信息
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-2 py-1">
            <form id="media-edit-form" onSubmit={handleSubmit} className="space-y-6 pb-2">
              {/* 媒体预览卡片 */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 relative group">
                    {media.media_type === 'IMAGE' ? (
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 ring-1 ring-gray-200">
                        <Image
                          src={resolveMediaImageUrl(media.url)}
                          alt={media.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-purple-200 group-hover:shadow-md transition-all duration-300">
                        <Video className="w-7 h-7 text-purple-600" />
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full shadow-sm animate-pulse"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
                      {media.filename}
                    </h3>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          {media.media_type}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          {formatFileSize(media.size)}
                        </span>
                      </div>
                      <p className="text-gray-400">
                        {new Date(media.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 表单内容 */}
              <div className="space-y-6">
                {/* 标题输入 */}
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                    标题
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="为这个媒体起个好听的名字..."
                    className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 hover:border-gray-300"
                  />
                </div>

                {/* 描述输入 */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    描述
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述一下这个媒体的内容..."
                    rows={3}
                    className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 hover:border-gray-300 resize-none"
                  />
                </div>

                {/* 分类选择 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-gray-400" />
                    分类
                  </Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 hover:border-gray-300">
                      <SelectValue placeholder="选择合适的分类" />
                    </SelectTrigger>
                    <SelectContent className="animate-in fade-in-0 zoom-in-95 duration-200">
                      <SelectItem value="none" className="text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          无分类
                        </div>
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              {category.name}
                            </div>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {category.count}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 标签选择 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    标签 ({formData.tagIds.length} 个已选)
                  </Label>
                  <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto hover:border-gray-300 transition-colors duration-200">
                    {tags.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tags.map((tag) => {
                          const isChecked = formData.tagIds.includes(tag.id);
                          return (
                            <label
                              key={tag.id}
                              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 group hover:bg-white hover:shadow-sm ${isChecked
                                ? 'bg-blue-50 border border-blue-200 shadow-sm'
                                : 'bg-white border border-gray-200 hover:border-blue-200'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        tagIds: [...prev.tagIds, tag.id]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        tagIds: prev.tagIds.filter(id => id !== tag.id)
                                      }));
                                    }
                                  }}
                                  className={`w-4 h-4 rounded border-2 transition-all duration-200 ${isChecked
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                />
                                <span className={`text-sm font-medium transition-colors duration-200 ${isChecked ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                                  }`}>
                                  {tag.name}
                                </span>
                              </div>
                              <Badge
                                variant={isChecked ? "default" : "secondary"}
                                className={`text-xs transition-all duration-200 ${isChecked ? 'bg-blue-100 text-blue-700 border-blue-200' : ''
                                  }`}
                              >
                                {tag.count}
                              </Badge>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Hash className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">暂无可用标签</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* 固定在底部的操作按钮 */}
          <div className="flex-shrink-0 flex justify-end gap-3 p-4 border-t border-gray-100 bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              取消
            </Button>
            <Button
              type="submit"
              form="media-edit-form"
              disabled={loading}
              className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  保存中...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  保存
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 主组件
export default function MediaManagementPage() {
  const { toast } = useToast();

  // 本地UI状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<MediaFilters>({
    status: 'APPROVED' // 默认只显示已审核通过的内容
  });
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  // 编辑状态
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 对话框状态
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  // 无限滚动引用
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 构建API筛选参数
  const apiFilters: MediaFilters = useMemo(() => ({
    search: searchTerm.trim() || undefined,
    ...filters
  }), [searchTerm, filters]);

  // 使用TanStack Query获取数据
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteMedia(apiFilters, 24);

  const { data: stats } = useMediaStats();

  // Mutation hooks
  const updateVisibilityMutation = useUpdateMediaVisibilityMutation();
  const batchUpdateVisibilityMutation = useBatchUpdateMediaVisibilityMutation();
  const updateInfoMutation = useUpdateMediaInfoMutation();
  const deleteMutation = useDeleteMediaMutation();
  const batchDeleteMutation = useBatchDeleteMediaMutation();

  // 合并所有页面的媒体数据
  const media = useMemo(() => {
    return data?.pages.flatMap(page => page.data || []) || [];
  }, [data]);

  // 统计信息
  const totalCount = data?.pages[0]?.pagination?.total || 0;

  // 处理错误
  React.useEffect(() => {
    if (isError && error) {
      console.error('加载媒体数据失败:', error);
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '无法加载媒体数据，请检查网络连接',
        variant: 'destructive'
      });
    }
  }, [isError, error, toast]);

  /**
   * 加载更多数据
   */
  // 无限滚动监听
  useIntersectionObserverLegacy({
    target: loadMoreRef as React.RefObject<Element>,
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    threshold: 0.1,
    rootMargin: '100px'
  });

  // 搜索防抖处理
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
      if (isDev) {
        console.log('🔍 搜索防抖触发:', searchTerm);
      }
        // TanStack Query会自动重新获取数据，因为queryKey发生了变化
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * 处理媒体选择
   */
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedMedia(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  /**
   * 全选/取消全选
   */
  const handleToggleSelectAll = useCallback(() => {
    if (selectedMedia.length === media.length) {
      setSelectedMedia([]);
    } else {
      setSelectedMedia(media.map(item => item.id));
    }
  }, [selectedMedia.length, media]);

  /**
   * 单个显示状态更新
   */
  const handleVisibilityUpdate = useCallback((id: string, visibility: 'VISIBLE' | 'HIDDEN') => {
    updateVisibilityMutation.mutate({
      mediaId: id,
      visibility
    });
  }, [updateVisibilityMutation]);

  /**
   * 打开编辑对话框
   */
  const handleEdit = useCallback((media: Media) => {
    setEditingMedia(media);
    setIsEditDialogOpen(true);
  }, []);

  /**
   * 关闭编辑对话框
   */
  const handleCloseEditDialog = useCallback(() => {
    setEditingMedia(null);
    setIsEditDialogOpen(false);
  }, []);

  /**
   * 保存编辑内容
   */
  const handleSaveEdit = useCallback((editData: {
    title: string;
    description: string;
    tagIds: string[];
    categoryId: string;
  }) => {
    if (!editingMedia) return;

    updateInfoMutation.mutate({
      mediaId: editingMedia.id,
      updates: {
        title: editData.title,
        description: editData.description,
        categoryId: editData.categoryId === 'none' ? null : editData.categoryId,
        tags: editData.tagIds
      }
    }, {
      onSuccess: () => {
        handleCloseEditDialog();
        // 刷新媒体数据缓存
        queryUtils.invalidateMedia();
      }
    });
  }, [editingMedia, updateInfoMutation, handleCloseEditDialog]);

  /**
   * 批量显示状态更新
   */
  const handleBatchVisibilityUpdate = useCallback((visibility: 'VISIBLE' | 'HIDDEN') => {
    if (selectedMedia.length === 0) {
      toast({
        title: '请选择媒体',
        description: '请先选择要更新显示状态的媒体文件',
        variant: 'destructive'
      });
      return;
    }

    batchUpdateVisibilityMutation.mutate({
      mediaIds: selectedMedia,
      visibility
    }, {
      onSuccess: () => {
        setSelectedMedia([]);
      }
    });
  }, [selectedMedia, batchUpdateVisibilityMutation, toast]);

  /**
   * 批量标签编辑
   */
  const handleBatchTagEdit = useCallback(() => {
    if (selectedMedia.length === 0) {
      toast({
        title: '请选择媒体',
        description: '请先选择要编辑标签的媒体文件',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: '功能开发中',
      description: '批量标签编辑功能正在开发中',
    });
  }, [selectedMedia, toast]);

  /**
   * 单个删除
   */
  const handleDelete = useCallback((id: string) => {
    setDeletingMediaId(id);
    setDeleteDialogOpen(true);
  }, []);

  /**
   * 确认单个删除
   */
  const confirmDelete = useCallback(() => {
    if (deletingMediaId) {
      deleteMutation.mutate(deletingMediaId, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeletingMediaId(null);
        },
        onError: () => {
          setDeleteDialogOpen(false);
          setDeletingMediaId(null);
        }
      });
    }
  }, [deletingMediaId, deleteMutation]);

  /**
   * 批量删除
   */
  const handleBatchDelete = useCallback(() => {
    if (selectedMedia.length === 0) {
      toast({
        title: '请选择媒体',
        description: '请先选择要删除的媒体文件',
        variant: 'destructive'
      });
      return;
    }

    setBatchDeleteDialogOpen(true);
  }, [selectedMedia, toast]);

  /**
   * 确认批量删除
   */
  const confirmBatchDelete = useCallback(() => {
    batchDeleteMutation.mutate(selectedMedia, {
      onSuccess: () => {
        setSelectedMedia([]);
        setBatchDeleteDialogOpen(false);
      },
      onError: () => {
        setBatchDeleteDialogOpen(false);
      }
    });
  }, [selectedMedia, batchDeleteMutation]);

  return (
    <div className="space-y-6">
      {/* 页面标题和统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-6 h-6" />
            <h1 className="text-2xl font-bold">媒体内容管理</h1>
          </div>
          {stats && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <Badge variant="secondary">总计 {(stats as any).overview?.total || 0}</Badge>
              <Badge variant="outline" className="text-green-600">
                显示 {(stats as any).overview?.visible || 0}
              </Badge>
              <Badge variant="outline" className="text-gray-600">
                隐藏 {(stats as any).overview?.hidden || 0}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setStatsDialogOpen(true)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>统计</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              refetch();
              queryUtils.invalidateMedia();
            }}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </Button>
        </div>
      </div>

      {/* 筛选和搜索栏 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索标题、描述或用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 显示状态筛选 */}
            <Select
              value={filters.visibility || 'ALL'}
              onValueChange={(value) =>
                setFilters(prev => ({
                  ...prev,
                  visibility: value === 'ALL' ? undefined : value as 'VISIBLE' | 'HIDDEN'
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="VISIBLE">显示</SelectItem>
                <SelectItem value="HIDDEN">隐藏</SelectItem>
              </SelectContent>
            </Select>

            {/* 媒体类型筛选 */}
            <Select
              value={filters.media_type || 'ALL'}
              onValueChange={(value) =>
                setFilters(prev => ({ ...prev, media_type: value === 'ALL' ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部类型</SelectItem>
                <SelectItem value="IMAGE">图片</SelectItem>
                <SelectItem value="VIDEO">视频</SelectItem>
              </SelectContent>
            </Select>

            {/* 日期范围筛选 */}
            <Select
              value={filters.date_range || 'ALL'}
              onValueChange={(value) =>
                setFilters(prev => ({ ...prev, date_range: value === 'ALL' ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部时间</SelectItem>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>

            {/* 批量操作 */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSelectAll}
                className="whitespace-nowrap"
              >
                {selectedMedia.length === media.length ? '取消全选' : '全选'}
              </Button>
              {selectedMedia.length > 0 && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  已选 {selectedMedia.length}
                </Badge>
              )}
            </div>
          </div>

          {/* 批量操作按钮 */}
          {selectedMedia.length > 0 && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">批量操作:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchVisibilityUpdate('VISIBLE')}
                className="text-green-600 hover:text-green-700"
              >
                <Eye className="w-4 h-4 mr-1" />
                批量显示
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchVisibilityUpdate('HIDDEN')}
                className="text-gray-600 hover:text-gray-700"
              >
                <EyeOff className="w-4 h-4 mr-1" />
                批量隐藏
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchTagEdit}
                className="text-blue-600 hover:text-blue-700"
              >
                <TagIcon className="w-4 h-4 mr-1" />
                批量标签
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                批量删除
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 媒体网格 */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner className="justify-center" />
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">暂无媒体内容</p>
              <p className="text-sm">
                {searchTerm || Object.keys(filters).length > 0
                  ? '没有找到符合条件的媒体文件'
                  : '还没有上传任何媒体文件'
                }
              </p>
            </div>
          ) : (
            <>
              {/* 媒体网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {media.map((item) => (
                  <MediaGridItem
                    key={item.id}
                    media={item}
                    isSelected={selectedMedia.includes(item.id)}
                    onToggleSelect={handleToggleSelect}
                    onPreview={setPreviewMedia}
                    onVisibilityUpdate={handleVisibilityUpdate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* 加载更多触发器 */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {isFetchingNextPage ? (
                    <LoadingSpinner />
                  ) : (
                    <Button variant="outline" onClick={() => fetchNextPage()}>
                      加载更多
                    </Button>
                  )}
                </div>
              )}

              {/* 页面信息 */}
              <div className="flex items-center justify-center pt-6 text-sm text-gray-500">
                已加载 {media.length} / {totalCount} 个媒体文件
                {data?.pages && data.pages.length > 1 && (
                  <span className="ml-2">
                    （已加载 {data.pages.length} 页）
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 媒体预览对话框 */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="border-b border-gray-100 pb-4 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              {previewMedia?.title || '媒体详情'}
            </DialogTitle>
          </DialogHeader>

          {previewMedia && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-1 py-2">
                <div className="space-y-6">
                  {/* 媒体预览 - 简化层级结构 */}
                  <div className="relative overflow-hidden rounded-xl">
                    {previewMedia.media_type === 'IMAGE' ? (
                      <div className="aspect-video overflow-hidden rounded-xl bg-black">
                        <Image
                          src={resolveMediaImageUrl(previewMedia.url)}
                          alt={previewMedia.title}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 80vw"
                        />
                      </div>
                    ) : (
                      <AdminVideoPlayerWrapper media={previewMedia} />
                    )}
                  </div>

                  {/* 媒体信息卡片 */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200/60 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      媒体信息
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">用户</p>
                            <p className="font-medium text-gray-900">{previewMedia.user.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">类型</p>
                            <p className="font-medium text-gray-900">{previewMedia.media_type === 'IMAGE' ? '图片' : '视频'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">大小</p>
                            <p className="font-medium text-gray-900">{(previewMedia.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>

                        {previewMedia.duration && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">时长</p>
                              <p className="font-medium text-gray-900">
                                {Math.floor(previewMedia.duration / 60)}:{(previewMedia.duration % 60).toString().padStart(2, '0')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">显示状态</p>
                            <p className="font-medium text-gray-900">{previewMedia.visibility === 'VISIBLE' ? '显示' : '隐藏'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">查看数</p>
                            <p className="font-medium text-gray-900">{previewMedia.views}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">点赞数</p>
                            <p className="font-medium text-gray-900">{previewMedia.likes_count}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">收藏数</p>
                            <p className="font-medium text-gray-900">{previewMedia.favorites_count || 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">创建时间</p>
                            <p className="font-medium text-gray-900">{new Date(previewMedia.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 描述卡片 */}
                  {previewMedia.description && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200/60 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        描述
                      </h3>
                      <div className="bg-white rounded-lg p-4 border border-gray-200/60">
                        <p className="text-gray-700 leading-relaxed">{previewMedia.description}</p>
                      </div>
                    </div>
                  )}

                  {/* 标签卡片 */}
                  {previewMedia.media_tags && previewMedia.media_tags.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-5 border border-gray-200/60 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        标签
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {previewMedia.media_tags.map((mediaTag) => (
                          <Badge
                            key={mediaTag.tag.id}
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors duration-200"
                          >
                            {mediaTag.tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 统计对话框 */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>媒体统计信息</DialogTitle>
          </DialogHeader>

          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">显示状态分布</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>总计</span>
                    <Badge variant="secondary">{(stats as any).overview?.total || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>显示</span>
                    <Badge variant="outline" className="text-green-600">{(stats as any).overview?.visible || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>隐藏</span>
                    <Badge variant="outline" className="text-gray-600">{(stats as any).overview?.hidden || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">类型分布</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>图片</span>
                    <Badge variant="outline">{(stats as any).byType?.image || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>视频</span>
                    <Badge variant="outline">{(stats as any).byType?.video || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">最近活动</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>今日上传</span>
                    <Badge variant="outline">{(stats as any).recentActivity?.today || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>本周上传</span>
                    <Badge variant="outline">{(stats as any).recentActivity?.thisWeek || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <MediaEditDialog
        isOpen={isEditDialogOpen}
        media={editingMedia}
        onClose={handleCloseEditDialog}
        onSave={handleSaveEdit}
      />



      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除媒体</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个媒体文件吗？此操作无法撤销，媒体文件将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDeletingMediaId(null);
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedMedia.length} 个媒体文件吗？此操作无法撤销，所有选中的媒体文件将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchDeleteDialogOpen(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={batchDeleteMutation.isPending}
            >
              {batchDeleteMutation.isPending && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              删除 {selectedMedia.length} 个文件
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
