'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import {
  useVideoDetail,
  useLikeVideoMutation,
  useFavoriteVideoMutation,
  useVideoInteractionStatus,
  useIncrementViewsMutation,
} from '@/hooks/useVideos';
import { VideoComments } from '../components/VideoComments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { Heart, Bookmark, Share2, Download, Eye, Clock, Calendar, Users, Link2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { buildVideoSources, getPosterUrl, getVideoContainerStyle } from '@/lib/utils/video-sources';
import RobustVideoPlayer from '@/components/video/RobustVideoPlayer';
import { getViewSessionId } from '@/lib/view-session';
import { requestMediaDownload } from '@/lib/utils/media-download';

const formatDuration = (seconds?: number | null) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
    return '--:--';
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

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('zh-CN').format(Math.max(0, value || 0));

interface VideoDetailPageProps {
  params: Promise<{ videoId: string }>;
}

type VideoTag = {
  id: string;
  name: string;
};

export default function ModernVideoDetailPage({ params }: VideoDetailPageProps) {
  const { videoId } = use(params);
  const { toast } = useToast();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [showDescription, setShowDescription] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: videoResponse, isError } = useVideoDetail(videoId);
  const { data: interactionStatus } = useVideoInteractionStatus(videoId);
  const incrementViewsMutation = useIncrementViewsMutation();
  const hasTrackedViewRef = useRef(false);

  const video = videoResponse?.data;
  const videoSources = useMemo(() => {
    if (!video) return [];

    const fallbackUrl =
      video.url ||
      video.hls_url ||
      (Array.isArray(video.video_qualities) && video.video_qualities.length > 0
        ? video.video_qualities[0].url
        : null);

    if (!fallbackUrl) {
      return [];
    }

    const mediaForSource = {
      ...video,
      url: fallbackUrl,
    };

    return buildVideoSources(mediaForSource, {
      isAuthenticated: true,
    });
  }, [video]);

  const posterUrl = useMemo(() => (video ? getPosterUrl(video) : undefined), [video]);
  const containerStyle = useMemo(
    () => (video ? getVideoContainerStyle(video) : undefined),
    [video],
  );

  useEffect(() => {
    if (!video) return;
    setLikeCount(video.likes_count || 0);
    setFavoriteCount(video.favorites_count || 0);
    setIsLiked(false);
    setIsFavorited(false);
    hasTrackedViewRef.current = false;
  }, [video]);

  useEffect(() => {
    if (!video || !interactionStatus?.data) return;
    setIsLiked(interactionStatus.data.isLiked);
    setIsFavorited(interactionStatus.data.isFavorited);

    if (typeof interactionStatus.data.likesCount === 'number') {
      setLikeCount(interactionStatus.data.likesCount);
    }
    if (typeof interactionStatus.data.favoritesCount === 'number') {
      setFavoriteCount(interactionStatus.data.favoritesCount);
    }
  }, [interactionStatus?.data, video]);

  const handlePlayStateChange = useCallback((isPlaying: boolean) => {
    if (!video || !isPlaying || hasTrackedViewRef.current) {
      return;
    }
    hasTrackedViewRef.current = true;
    const sessionId = getViewSessionId();
    incrementViewsMutation.mutate({
      mediaId: video.id,
      sessionId: sessionId ?? undefined,
      mediaType: 'VIDEO',
      event: 'play',
    });
  }, [video, incrementViewsMutation]);

  const likeMutation = useLikeVideoMutation();
  const favoriteMutation = useFavoriteVideoMutation();

  if (isError) {
    notFound();
  }

  if (!video) {
    return <VideoDetailSkeleton />;
  }

  if (videoSources.length === 0) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto flex h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center text-slate-500 dark:text-slate-400">
          <p className="text-lg font-semibold">视频资源暂时不可用</p>
          <p className="text-sm">请稍后刷新重试或联系管理员处理</p>
        </div>
      </div>
    );
  }

  const commentsTotal = video.comments_count ?? 0;
  const tags: VideoTag[] =
    video.tags && video.tags.length > 0
      ? video.tags
      : (video.media_tags ?? [])
          .map((item) => item?.tag)
          .filter(
            (tag): tag is VideoTag =>
              Boolean(tag)
          );

  const stats = [
    { label: '观看', icon: Eye, value: `${formatViews(video.views)} 次` },
    { label: '点赞', icon: Heart, value: `${formatCompactNumber(likeCount)} 次` },
    { label: '收藏', icon: Bookmark, value: `${formatCompactNumber(favoriteCount)} 位` },
    {
      label: '发布',
      icon: Calendar,
      value: formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: zhCN }),
    },
  ];

  const handleLike = () => {
    const next = !isLiked;
    const delta = next ? 1 : -1;
    setIsLiked(next);
    setLikeCount((prev) => Math.max(0, (prev || 0) + delta));

    likeMutation.mutate(
      { videoId: video.id, isLiked: next },
      {
        onError: () => {
          setIsLiked(!next);
          setLikeCount((prev) => Math.max(0, (prev || 0) - delta));
        },
      }
    );
  };

  const handleFavorite = () => {
    const next = !isFavorited;
    const delta = next ? 1 : -1;
    setIsFavorited(next);
    setFavoriteCount((prev) => Math.max(0, (prev || 0) + delta));

    favoriteMutation.mutate(
      { videoId: video.id, isFavorited: next },
      {
        onError: () => {
          setIsFavorited(!next);
          setFavoriteCount((prev) => Math.max(0, (prev || 0) - delta));
        },
      }
    );
  };

  const handleVideoDownload = async () => {
    if (!video) return;
    try {
      setIsDownloading(true);
      await requestMediaDownload(video.id, `${video.title || 'video'}.mp4`);
      toast({
        title: '下载开始',
        description: '视频正在下载',
      });
    } catch (error) {
      console.error('下载失败', error);
      toast({
        title: '下载失败',
        description: '无法下载该视频，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || `来看看这个视频：${video.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('分享取消', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: '链接已复制',
        description: '快邀请朋友一起来看吧～',
        duration: 2000,
      });
    } catch (error) {
      console.error('复制失败', error);
      toast({
        title: '复制失败',
        description: '请稍后再试',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-10">
      <div className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <div
              className="overflow-hidden rounded-2xl border border-gray-200/60 bg-black shadow-sm"
              style={containerStyle}
            >
              <RobustVideoPlayer
                key={video.id}
                src={videoSources}
                poster={posterUrl}
                autoplay={false}
                aspectRatio="auto"
                controls
                className="h-full w-full"
                enableQualitySelector={videoSources.length > 1}
                onPlayStateChange={handlePlayStateChange}
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
            </div>

            <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-sm">
              <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">{video.title}</h1>
              <div className="mt-4 grid gap-4 text-sm text-gray-600 sm:grid-cols-4">
                {stats.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                ))}
                {typeof video.duration === 'number' && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">时长</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDuration(video.duration)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  data-tone="like"
                  data-active={isLiked ? 'true' : 'false'}
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  className={isLiked
                    ? 'bg-red-100 text-red-600 border-red-200'
                    : 'bg-white/80 border-red-200/60 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  喜欢
                  {likeCount > 0 && <span className="ml-1 text-xs opacity-80">({formatCompactNumber(likeCount)})</span>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-tone="favorite"
                  data-active={isFavorited ? 'true' : 'false'}
                  onClick={handleFavorite}
                  disabled={favoriteMutation.isPending}
                  className={isFavorited
                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-white/80 border-amber-200/60 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'}
                >
                  <Bookmark className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                  收藏
                  {favoriteCount > 0 && (
                    <span className="ml-1 text-xs opacity-80">({formatCompactNumber(favoriteCount)})</span>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  分享
                </Button>
                <Button variant="outline" size="sm" onClick={handleVideoDownload} disabled={isDownloading}>
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloading ? '下载中...' : '下载'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                  <Link2 className="mr-2 h-4 w-4" />
                  复制链接
                </Button>
              </div>
            </section>

            <section className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={video.user.avatar_url}
                  name={video.user.nickname || video.user.username}
                  size="lg"
                  withBorder
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{video.user.username}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3 w-3" />
                    创作者
                  </p>
                </div>
              </div>
              <Button size="sm">关注</Button>
            </section>

            {video.description && (
              <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowDescription((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-900"
                >
                  <span>视频简介</span>
                  {showDescription ? <Clock className="h-4 w-4 rotate-90" /> : <Clock className="h-4 w-4 -rotate-90" />}
                </button>
                {showDescription && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                    {video.description}
                  </p>
                )}
              </section>
            )}

            {tags.length > 0 && (
              <section className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">相关标签</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id ?? tag.name} variant="secondary" className="rounded-full bg-white/80">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="flex h-[720px] flex-col rounded-2xl border border-gray-200/60 bg-white/80 p-4 shadow-sm">
            <VideoComments
              videoId={video.id}
              commentsCount={commentsTotal}
              variant="panel"
              className="flex h-full flex-col"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function VideoDetailSkeleton() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="aspect-video animate-pulse bg-[color:var(--theme-surface-alt)]" />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-2xl bg-[color:var(--theme-surface)]" />
            <div className="h-32 animate-pulse rounded-2xl bg-[color:var(--theme-surface)]" />
            <div className="h-24 animate-pulse rounded-2xl bg-[color:var(--theme-surface)]" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <div className="h-20 w-32 animate-pulse rounded-md bg-[color:var(--theme-surface)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[color:var(--theme-surface)]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[color:var(--theme-surface)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
