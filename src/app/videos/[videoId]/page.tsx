'use client';

import { use, useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoDetail, useRecommendedVideos, useLikeVideoMutation, useFavoriteVideoMutation } from '@/hooks/useVideos';
import RobustVideoPlayer from '@/components/video/RobustVideoPlayer';
import { VideoCardThumbnail } from '@/components/VideoThumbnail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  Bookmark,
  Share2,
  Download,
  Eye,
  Clock,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// URL格式化函数 - 确保视频URL可以正确访问
const formatVideoUrl = (url: string | null | undefined): string => {
  if (!url) return '';

  // 获取后端API基础URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const BASE_URL = API_BASE_URL.replace('/api', ''); // 移除 /api 后缀得到基础URL

  // 如果已经是绝对URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 如果已经是正确的API路径，直接返回
  if (url.startsWith('/api/upload/file/')) {
    return `${BASE_URL}${url}`;
  }

  // 处理processed路径（视频处理后的文件）
  if (url.startsWith('/processed/')) {
    return `${BASE_URL}${url}`;
  }

  // 处理数据库存储的相对路径格式
  if (url.startsWith('uploads/')) {
    const pathParts = url.replace('uploads/', '');
    return `${BASE_URL}/api/upload/file/${pathParts}`;
  }

  // 如果以/开头，指向后端静态服务
  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  }

  // 其他情况，尝试作为后端API路径
  return `${BASE_URL}/api/upload/file/${url}`;
};

interface VideoDetailPageProps {
  params: Promise<{ videoId: string }>;
}

export default function ModernVideoDetailPage({ params }: VideoDetailPageProps) {
  const { videoId } = use(params);
  const { toast } = useToast();
  const router = useRouter();

  // 本地状态
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showMoreVideos, setShowMoreVideos] = useState(8);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 查询数据
  const { data: videoResponse, isError } = useVideoDetail(videoId);
  const { data: recommendedResponse } = useRecommendedVideos(videoId, 20);

  // 从响应中提取视频数据
  const video = videoResponse?.data;

  // 准备视频源数据 - 使用格式化URL
  const videoSources = video ? (() => {
    const sources = [];
    if (video.hls_url) {
      sources.push({ src: formatVideoUrl(video.hls_url), type: 'application/x-mpegURL', label: 'HLS' });
    }
    if (video.video_qualities && video.video_qualities.length > 0) {
      video.video_qualities.forEach(quality => {
        sources.push({
          src: formatVideoUrl(quality.url),
          type: 'video/mp4',
          label: quality.quality || `${quality.height}p`,
          res: quality.height ? `${quality.height}p` : undefined
        });
      });
    } else if (video.url) {
      sources.push({ src: formatVideoUrl(video.url), type: 'video/mp4', label: '原画' });
    }

    // 调试：打印视频源信息
    console.log('🎬 VideoDetail 视频源:', {
      videoId: video.id,
      originalUrl: video.url,
      hlsUrl: video.hls_url,
      sources: sources.map(source => ({
        src: source.src,
        label: source.label,
        type: source.type
      }))
    });

    return sources;
  })() : [];

  // Mutations
  const likeMutation = useLikeVideoMutation();
  const favoriteMutation = useFavoriteVideoMutation();

  // 监听全屏状态
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isError) {
    notFound();
  }

  if (!video) {
    return <VideoDetailSkeleton />;
  }

  const recommendedVideos = recommendedResponse?.data || [];
  const downloadUrl = formatVideoUrl(video.original_file_url ?? video.url);

  // 处理交互
  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    likeMutation.mutate({ videoId: video.id, isLiked: newState });
  };

  const handleFavorite = () => {
    const newState = !isFavorited;
    setIsFavorited(newState);
    favoriteMutation.mutate({ videoId: video.id, isFavorited: newState });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || `来看看这个视频：${video.title}`,
          url: window.location.href,
        });
      } catch (shareError) {
        console.log('分享取消', shareError);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: '链接已复制到剪贴板' });
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (typeof seconds !== "number" || Number.isNaN(seconds)) {
      return "--:--";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 10000) {
      return `${(views / 10000).toFixed(1)}万`;
    }
    return views.toString();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* 顶部导航 - 仅在非全屏时显示 */}
      <AnimatePresence>
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200/20"
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="hover:bg-gray-100/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto">
        {/* 视频播放器区域 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'} bg-black`}
        >
          <RobustVideoPlayer
            src={videoSources}
            poster={formatVideoUrl(video.thumbnail_url)}
            autoplay={false}
            aspectRatio="auto"
            controls={true}
            className="w-full h-full"
            enableQualitySelector={videoSources.length > 1}
            onError={(error: unknown) => {
              console.error('❌ 视频播放错误:', error);
              toast({
                title: '播放出错',
                description: typeof error === 'string' ? error : '播放出现错误',
                variant: 'destructive',
              });
            }}
            onRequireAuth={() => {
              toast({
                title: '请登录后观看高清画质',
                description: '登录账号即可播放 1080p 等高清画质内容',
              });
            }}
          />
        </motion.div>

        {/* 内容区域 */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* 主要内容 */}
            <div className="xl:col-span-3">
              {/* 视频标题和统计 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {video.title}
                </h1>

                {/* 统计信息 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatViews(video.views)} 观看</span>
                  </div>
                  {typeof video.duration === 'number' && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: zhCN })}</span>
                  </div>
                </div>
              </motion.div>

              {/* 交互按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-8"
              >
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className="transition-all duration-200"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  <span>喜欢</span>
                  {video.likes_count > 0 && (
                    <span className="ml-1 text-xs">({video.likes_count})</span>
                  )}
                </Button>

                <Button
                  variant={isFavorited ? "default" : "outline"}
                  size="sm"
                  onClick={handleFavorite}
                  className="transition-all duration-200"
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  <span>收藏</span>
                </Button>

                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  <span>分享</span>
                </Button>

                {downloadUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={downloadUrl} download target="_blank">
                      <Download className="w-4 h-4 mr-2" />
                      <span>下载</span>
                    </a>
                  </Button>
                )}
              </motion.div>

              <Separator className="mb-8" />

              {/* 创作者信息 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between mb-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={video.user.avatar_url} alt={video.user.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {video.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{video.user.username}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      创作者
                    </p>
                  </div>
                </div>

                <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  关注
                </Button>
              </motion.div>

              {/* 视频描述 */}
              {video.description && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <Button
                    variant="ghost"
                    onClick={() => setShowDescription(!showDescription)}
                    className="p-0 h-auto font-medium text-gray-900 dark:text-white hover:bg-transparent"
                  >
                    <span className="mr-2">描述</span>
                    {showDescription ?
                      <ChevronUp className="w-4 h-4" /> :
                      <ChevronDown className="w-4 h-4" />
                    }
                  </Button>

                  <AnimatePresence>
                    {showDescription && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50"
                      >
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {video.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* 标签 */}
              {video.tags && video.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-2 mb-8"
                >
                  {video.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition-colors"
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                </motion.div>
              )}
            </div>

            {/* 侧边栏 - 推荐视频 */}
            <div className="xl:col-span-1">
              {recommendedVideos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="sticky top-24"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    推荐视频
                  </h3>

                  <div className="space-y-4">
                    {recommendedVideos.slice(0, showMoreVideos).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => router.push(`/videos/${item.id}`)}
                        className="group cursor-pointer"
                      >
                        <div className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <div className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden">
                            <VideoCardThumbnail
                              src={item.thumbnail_url}
                              alt={item.title}
                              duration={typeof item.duration === 'number' ? item.duration : undefined}
                              className="w-full h-full"
                              showPlayIcon={false}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {item.user.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {formatViews(item.views)} 观看 •{' '}
                              {formatDistanceToNow(new Date(item.created_at), { locale: zhCN })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {recommendedVideos.length > showMoreVideos && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMoreVideos(prev => prev + 8)}
                      className="w-full mt-4"
                    >
                      查看更多
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 加载骨架组件
function VideoDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="xl:col-span-1 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-40 aspect-video bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
