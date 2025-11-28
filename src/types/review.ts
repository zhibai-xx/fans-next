export type ReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ReviewFilters {
  status?: ReviewStatus;
  type?: 'IMAGE' | 'VIDEO';
  categoryId?: string;
  tagId?: string;
  userUuid?: string;
  search?: string;
  sortBy?: 'created_at' | 'views' | 'likes_count';
  sortOrder?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  private: number;
  images: number;
  videos: number;
  todayPending: number;
  todayReviewed: number;
}

export interface BatchOperationResult {
  successCount: number;
  failureCount: number;
  successIds: string[];
  failureIds: string[];
  errors: string[];
}

export interface BatchUpdateStatusData {
  mediaIds: string[];
  status: ReviewStatus;
  reason?: string;
}

export interface BatchUpdateTagsData {
  mediaIds: string[];
  tagIds: string[];
  action?: 'add' | 'replace';
}

export interface BatchUpdateCategoryData {
  mediaIds: string[];
  categoryId?: string;
}
