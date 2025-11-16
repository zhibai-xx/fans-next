'use client'

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useVideoComments, useCreateVideoComment } from '@/hooks/useVideoComments';
import type { VideoComment, CommentSortOption } from '@/types/comment';
import { UserAvatar } from '@/components/avatar/UserAvatar';

interface VideoCommentsProps {
  videoId: string;
  commentsCount: number;
  variant?: 'default' | 'panel';
  className?: string;
}

const COMMENT_LIMIT = 20;

const formatTimestamp = (value: string) =>
  formatDistanceToNow(new Date(value), { addSuffix: true, locale: zhCN });

const CommentCard = ({ comment }: { comment: VideoComment }) => {
  const repliesPreview = comment.replies_preview ?? [];

  return (
    <div className="flex items-start gap-3">
      <UserAvatar
        src={comment.author.avatar_url}
        name={comment.author.nickname || comment.author.username}
        size="sm"
      />
      <div className="flex-1">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {comment.author.username}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formatTimestamp(comment.created_at)}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {comment.content}
          </p>
          {(comment.replies_count > 0 || repliesPreview.length > 0) && (
            <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              {repliesPreview.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <span className="font-medium">{reply.author.username}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {reply.content}
                  </span>
                </div>
              ))}
              {comment.has_more_replies && (
                <span className="block text-blue-500">还有更多回复，稍后开放查看</span>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <Button variant="ghost" size="sm" className="h-auto px-1 text-slate-400 hover:text-blue-500">
              回复
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function VideoComments({
  videoId,
  commentsCount,
  variant = 'default',
  className,
}: VideoCommentsProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [sortBy, setSortBy] = useState<CommentSortOption>('hot');

  const queryParams = useMemo(
    () => ({
      sort: sortBy,
      limit: COMMENT_LIMIT,
    }),
    [sortBy],
  );

  const commentQuery = useVideoComments(videoId, queryParams);
  const createComment = useCreateVideoComment(videoId);

  const isLoading = commentQuery.isLoading || authLoading;
  const comments = commentQuery.data?.data ?? [];
  const displayedCount = commentQuery.data?.pagination.total ?? commentsCount ?? 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    if (!isAuthenticated) {
      toast({
        title: '请先登录',
        description: '登录后才能发布留言',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createComment.mutateAsync({
        content: inputValue.trim(),
      });
      setInputValue('');
      toast({
        title: '留言已发布',
        description: '感谢你的分享~',
        duration: 2000,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '发布失败，请稍后再试';
      toast({
        title: '留言失败',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const isPanel = variant === 'panel';
  const disableInput = !isAuthenticated || createComment.isPending;

  return (
    <div className={cn(isPanel ? 'flex h-full flex-col' : 'space-y-4', className)}>
      <div className={cn('flex items-center justify-between', isPanel && 'pb-3')}>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          留言 ({displayedCount})
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Button
            variant={sortBy === 'hot' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('hot')}
          >
            热门
          </Button>
          <Button
            variant={sortBy === 'latest' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('latest')}
          >
            最新
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'space-y-4 rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
          isPanel && 'flex-1 overflow-y-auto border-none bg-transparent p-0 shadow-none'
        )}
      >
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
          </div>
        ) : commentQuery.isError ? (
          <div className="py-12 text-center text-sm text-rose-500">
            无法加载留言，请稍后刷新
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
        ) : (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
            暂无留言，快来抢沙发
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          'mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900',
          isPanel && 'border-t border-slate-200/70 dark:border-slate-800/70'
        )}
      >
        <UserAvatar src={user?.avatar_url} name={user?.nickname || user?.username} size="sm" />
        <div className="flex-1 space-y-3">
          <Textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={isAuthenticated ? '分享你的想法…' : '登录后才能留言'}
            rows={isPanel ? 2 : 3}
            disabled={disableInput}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!inputValue.trim() || disableInput}>
              {createComment.isPending ? '发布中…' : '发布留言'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
