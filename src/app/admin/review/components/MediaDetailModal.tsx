'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit3, AlertCircle } from 'lucide-react';
import { MediaItem, MediaTag } from '@/services/media.service';
import { ReviewService } from '@/services/review.service';
import { handleApiError } from '@/lib/utils/error-handler';
import RobustVideoPlayer from '@/components/video/RobustVideoPlayer';
import { resolveMediaImageUrl } from '@/lib/utils/media-url';
import { buildVideoSources, getPosterUrl, getVideoContainerStyle } from '@/lib/utils/video-sources';

interface MediaDetailModalProps {
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

const isDev = process.env.NODE_ENV !== 'production';

const extractMediaTags = (media: MediaItem | null): MediaTag[] => {
  if (!media) return [];
  if (Array.isArray(media.media_tags) && media.media_tags.length > 0) {
    return media.media_tags
      .map((item) => item?.tag)
      .filter((tag): tag is MediaTag => Boolean(tag));
  }
  return Array.isArray(media?.tags) ? media.tags : [];
};

const extractTagIds = (media: MediaItem | null): string[] => {
  return extractMediaTags(media).map((tag) => tag.id);
};

// 视频播放器包装组件 - 使用React.memo避免不必要的重新渲染
const VideoPlayerWrapper = React.memo(function VideoPlayerWrapper({ media }: { media: MediaItem }) {
  const [isModalReady, setIsModalReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 等待Modal完全打开后再初始化Video.js
  useEffect(() => {
    if (isDev) {
      console.log('🎬 VideoPlayerWrapper 组件挂载，准备延迟初始化...');
    }

    // 使用requestAnimationFrame确保DOM完全渲染
    const checkDOMReady = () => {
      if (containerRef.current && document.contains(containerRef.current)) {
        if (isDev) {
          console.log('✅ DOM容器已准备好');
        }
        const timer = setTimeout(() => {
          if (isDev) {
            console.log('🎬 Modal动画完成，准备初始化Video.js...');
          }
          setIsModalReady(true);
        }, 600); // 增加延迟时间确保Modal完全稳定

        return () => clearTimeout(timer);
      } else {
        if (isDev) {
          console.log('⏳ 等待DOM容器准备...');
        }
        const retryTimer = setTimeout(checkDOMReady, 100);
        return () => clearTimeout(retryTimer);
      }
    };

    // 使用双重检查：requestAnimationFrame + setTimeout
    const frameId = requestAnimationFrame(() => {
      const cleanup = checkDOMReady();
      return cleanup;
    });

    return () => {
      if (isDev) {
        console.log('🧹 VideoPlayerWrapper 清理');
      }
      cancelAnimationFrame(frameId);
    };
  }, []); // 空依赖数组，只在组件挂载时运行
  // 使用useMemo缓存视频源，避免每次渲染都重新创建导致无限重试
  const videoSources = useMemo(() => {
    const sources = buildVideoSources(media, { isAuthenticated: true });

    if (isDev) {
      console.log('🎬 MediaDetailModal 视频源详情:', {
        mediaId: media.id,
        originalUrl: media.url,
        thumbnailUrl: media.thumbnail_url,
        videoQualities: media.video_qualities,
        videoSources: sources.map(source => ({
          src: source.src,
          label: source.label,
          type: source.type
        })),
        hasValidSources: sources.length > 0,
        mediaType: media.media_type
      });
    }

    return sources;
  }, [media]);

  const containerStyle = useMemo((): React.CSSProperties => getVideoContainerStyle(media), [media]);

  // 缓存海报URL
  const posterUrl = useMemo(() => getPosterUrl(media), [media]);

  // 如果没有有效的视频源，显示错误信息而不是播放器
  if (videoSources.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">视频无法播放</h3>
          <p className="text-sm text-gray-500">视频文件可能已损坏或不存在</p>
        </div>
      </div>
    );
  }

  if (!isModalReady) {
    return (
      <div
        ref={containerRef}
        className="relative w-full rounded-lg bg-black overflow-hidden"
        style={containerStyle}
      >
        <div className="text-white text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          <p className="text-sm">正在初始化播放器...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg bg-black overflow-hidden"
      style={containerStyle}
    >
      <RobustVideoPlayer
        key={`robust-video-${media.id}`}
        src={videoSources}
        poster={posterUrl}
        aspectRatio="auto"
        controls={true}
        autoplay={false}
        enableQualitySelector={videoSources.length > 1}
        onError={(error) => {
          console.error('审核页面视频播放错误:', error);
        }}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // 只有当media.id变化时才重新渲染
  return prevProps.media.id === nextProps.media.id;
});

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE';

interface MediaFormState {
  title: string;
  description: string;
  category_id: string;
  status: ReviewStatus;
  tag_ids: string[];
}

export function MediaDetailModal({ media, isOpen, onClose, onUpdate }: MediaDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑表单状态
  const [formData, setFormData] = useState<MediaFormState>({
    title: '',
    description: '',
    category_id: '',
    status: 'PENDING',
    tag_ids: []
  });

  // 选项数据
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);

  const currentMediaTags = useMemo(() => extractMediaTags(media), [media]);

  // 初始化表单数据
  useEffect(() => {
    if (media) {
      setFormData({
        title: media.title || '',
        description: media.description || '',
        category_id: media.category?.id || '',
        status: media.status,
        tag_ids: extractTagIds(media)
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

  const handleInputChange = useCallback(<K extends keyof MediaFormState>(
    field: K,
    value: MediaFormState[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
        // 修复：确保category_id为空时传undefined而不是空字符串
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
      let updateData;

      if (media.status === 'PENDING') {
        // 待审核 → 通过
        updateData = {
          title: formData.title,
          description: formData.description,
          // 修复：确保category_id为空时传undefined而不是空字符串
          category_id: formData.category_id && formData.category_id !== 'none' && formData.category_id.trim() !== ''
            ? formData.category_id
            : undefined,
          status: 'APPROVED' as const,
          tag_ids: formData.tag_ids
        };
      } else {
        setError('当前状态不允许此操作');
        return;
      }

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
      let updateData;

      if (media.status === 'PENDING') {
        // 待审核 → 拒绝
        updateData = {
          title: formData.title,
          description: formData.description,
          // 修复：确保category_id为空时传undefined而不是空字符串
          category_id: formData.category_id && formData.category_id !== 'none' && formData.category_id.trim() !== ''
            ? formData.category_id
            : undefined,
          status: 'REJECTED' as const,
          tag_ids: formData.tag_ids
        };
      } else {
        setError('当前状态不允许此操作');
        return;
      }

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

  const handleWithdrawRejection = async () => {
    if (!media) return;

    setIsLoading(true);
    setError(null);

    try {
      if (media.status !== 'REJECTED') {
        setError('只有已拒绝的内容才能撤回拒绝');
        return;
      }

      // 已拒绝 → 撤回到待审核
      const updateData = {
        title: formData.title,
        description: formData.description,
        // 修复：确保category_id为空时传undefined而不是空字符串
        category_id: formData.category_id && formData.category_id !== 'none' && formData.category_id.trim() !== ''
          ? formData.category_id
          : undefined,
        status: 'PENDING' as const,
        tag_ids: formData.tag_ids
      };

      const updatedMedia = await ReviewService.updateMediaInfo(media.id, updateData);

      onUpdate(updatedMedia);
      onClose();
    } catch (err) {
      console.error('撤回拒绝失败:', err);
      setError(handleApiError(err, '撤回拒绝失败'));
    } finally {
      setIsLoading(false);
    }
  };

  // 判断是否可以编辑
  const canEdit = media?.status === 'PENDING';

  // 判断是否可以审核操作
  const canApprove = media?.status === 'PENDING';
  const canReject = media?.status === 'PENDING';
  const canWithdrawRejection = media?.status === 'REJECTED';

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

  const getStatusHint = (status: string) => {
    switch (status) {
      case 'APPROVED': return '已通过的内容请在媒体管理页面进行管理';
      case 'REJECTED': return '已拒绝的内容可以撤回拒绝，重新进入待审核状态';
      case 'PENDING': return '待审核的内容可以编辑信息并进行审核';
      default: return '';
    }
  };

  const previewContainerStyle = useMemo((): React.CSSProperties => {
    if (!media) {
      return {
        aspectRatio: '16 / 9',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '70vh',
        margin: '0 auto'
      };
    }

    if (media.width && media.height) {
      const ratio = media.width / media.height;
      const isPortrait = ratio < 0.8;
      if (!isPortrait) {
        return {
          aspectRatio: `${media.width} / ${media.height}`,
          width: '100%',
          maxWidth: '800px',
          maxHeight: '70vh',
          margin: '0 auto'
        };
      }

      return {
        aspectRatio: `${media.width} / ${media.height}`,
        width: 'min(100%, 420px)',
        margin: '0 auto'
      };
    }

    return {
      aspectRatio: '16 / 9',
      width: '100%',
      maxWidth: '800px',
      maxHeight: '70vh',
      margin: '0 auto'
    };
  }, [media]);
  if (!media) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between pr-6">
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit3 className="h-5 w-5" />
                    编辑媒体信息
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    媒体详情
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {isEditing ? '编辑媒体文件的详细信息和状态' : '查看媒体文件的详细信息'}
              </DialogDescription>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={getStatusColor(formData.status)}>
                  {getStatusText(formData.status)}
                </Badge>
                <Badge variant="outline">
                  {media.media_type === 'IMAGE' ? '图片' : '视频'}
                </Badge>
              </div>
            </div>
            {/* 状态提示 */}
            <div className="text-sm text-gray-600">
              {getStatusHint(media.status)}
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div
                className="relative flex w-full items-center justify-center rounded-lg bg-black"
                style={previewContainerStyle}
              >
                {media.media_type === 'IMAGE' ? (
                  <img
                    src={resolveMediaImageUrl(media.thumbnail_url || media.url)}
                    alt={media.title}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  isOpen && <VideoPlayerWrapper key={media.id} media={media} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div className="whitespace-nowrap">
                  <span className="font-medium text-gray-600">文件大小:</span>
                  <span className="ml-2">{(media.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="whitespace-nowrap">
                  <span className="font-medium text-gray-600">上传者:</span>
                  <span className="ml-2">{media.user.username}</span>
                </div>
                {media.width && media.height && (
                  <div className="whitespace-nowrap">
                    <span className="font-medium text-gray-600">尺寸:</span>
                    <span className="ml-2">{media.width} × {media.height}</span>
                  </div>
                )}
                {media.duration && (
                  <div className="whitespace-nowrap">
                    <span className="font-medium text-gray-600">时长:</span>
                    <span className="ml-2">{Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
                <div className="whitespace-nowrap">
                  <span className="font-medium text-gray-600">上传时间:</span>
                  <span className="ml-2">{new Date(media.created_at).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="title">标题</Label>
                {isEditing && canEdit ? (
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="请输入标题"
                  />
                ) : (
                  <p className="mt-2 rounded-md bg-gray-50 p-2">{formData.title || '无标题'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">描述</Label>
                {isEditing && canEdit ? (
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="请输入描述"
                    rows={3}
                  />
                ) : (
                  <p className="mt-2 min-h-[80px] rounded-md bg-gray-50 p-2">
                    {formData.description || '无描述'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">分类</Label>
                {isEditing && canEdit ? (
                  <Select
                    value={formData.category_id || 'none'}
                    onValueChange={(value) =>
                      handleInputChange('category_id', value === 'none' ? '' : value)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无分类</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-2 rounded-md bg-gray-50 p-2">
                    {media.category?.name || '无分类'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="status">状态</Label>
                {isEditing && canEdit ? (
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange('status', value as ReviewStatus)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">待审核</SelectItem>
                      <SelectItem value="PRIVATE">私有</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-2">
                    <Badge className={getStatusColor(formData.status)}>
                      {getStatusText(formData.status)}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <Label>标签</Label>
                {isEditing && canEdit ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-md border p-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={formData.tag_ids.includes(tag.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentMediaTags.length > 0 ? (
                      currentMediaTags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">无标签</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                  >
                    编辑
                  </Button>
                )}
                {canWithdrawRejection && (
                  <Button
                    variant="outline"
                    onClick={handleWithdrawRejection}
                    disabled={isLoading}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    撤回拒绝
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
                  >
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
                    // 重置表单数据
                    if (media) {
                      setFormData({
                        title: media.title || '',
                        description: media.description || '',
                        category_id: media.category?.id || '',
                        status: media.status,
                        tag_ids: extractTagIds(media)
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
                    {isLoading ? '处理中...' : '保存并通过'}
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
