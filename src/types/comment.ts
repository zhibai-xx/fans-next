export type CommentSortOption = 'hot' | 'latest';

export interface VideoCommentAuthor {
  uuid: string;
  username: string;
  avatar_url?: string | null;
}

export interface VideoCommentPreview {
  id: string;
  media_id: string;
  parent_id: string | null;
  content: string;
  author: VideoCommentAuthor;
  created_at: string;
  updated_at: string;
}

export interface VideoComment extends VideoCommentPreview {
  replies_count: number;
  replies_preview: VideoCommentPreview[];
  has_more_replies: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VideoCommentListResponse {
  success: boolean;
  data: VideoComment[];
  pagination: PaginationMeta;
}

export interface CreateVideoCommentResponse {
  success: boolean;
  data: VideoComment;
}

export interface CreateVideoCommentPayload {
  content: string;
  parent_id?: string;
}

export interface CommentQueryParams {
  page?: number;
  limit?: number;
  sort?: CommentSortOption;
  parentId?: string;
}
