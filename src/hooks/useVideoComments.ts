import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CommentService } from '@/services/comment.service';
import type {
  CommentQueryParams,
  CreateVideoCommentPayload,
} from '@/types/comment';

const commentKeys = {
  all: ['video-comments'] as const,
  lists: (videoId: string) => [...commentKeys.all, videoId, 'list'] as const,
  list: (videoId: string, params: CommentQueryParams) =>
    [...commentKeys.lists(videoId), params] as const,
};

export function useVideoComments(videoId: string, params: CommentQueryParams) {
  return useQuery({
    queryKey: commentKeys.list(videoId, params),
    queryFn: () => CommentService.getVideoComments(videoId, params),
    enabled: Boolean(videoId),
    keepPreviousData: true,
    staleTime: 60_000,
  });
}

export function useCreateVideoComment(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVideoCommentPayload) =>
      CommentService.createVideoComment(videoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.lists(videoId) });
    },
  });
}

export const videoCommentKeys = commentKeys;
