import { apiClient } from '@/lib/api-client';
import type {
  CommentQueryParams,
  CreateVideoCommentPayload,
  CreateVideoCommentResponse,
  VideoCommentListResponse,
} from '@/types/comment';

export class CommentService {
  static async getVideoComments(
    mediaId: string,
    params: CommentQueryParams,
  ): Promise<VideoCommentListResponse> {
    return apiClient.get(`/media/${mediaId}/comments`, {
      withAuth: false,
      params: {
        page: params.page,
        limit: params.limit,
        sort: params.sort,
        parentId: params.parentId,
      },
    });
  }

  static async createVideoComment(
    mediaId: string,
    payload: CreateVideoCommentPayload,
  ): Promise<CreateVideoCommentResponse> {
    return apiClient.post(`/media/${mediaId}/comments`, payload);
  }
}
