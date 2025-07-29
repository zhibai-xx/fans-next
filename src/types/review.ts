// 审核统计数据
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

// 批量操作结果
export interface BatchOperationResult {
  successCount: number;
  failureCount: number;
  successIds: string[];
  failureIds: string[];
  errors: string[];
}

// 审核筛选条件
export interface ReviewFilters {
  type?: 'IMAGE' | 'VIDEO';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE';
  categoryId?: string;
  tagId?: string;
  userUuid?: string;
  search?: string;
  sortBy?: 'created_at' | 'views' | 'likes_count' | 'size';
  sortOrder?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}

// 批量状态更新数据
export interface BatchUpdateStatusData {
  mediaIds: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE';
  note?: string;
}

// 批量标签更新数据
export interface BatchUpdateTagsData {
  mediaIds: string[];
  tagIds: string[];
  action: 'add' | 'replace';
}

// 批量分类更新数据
export interface BatchUpdateCategoryData {
  mediaIds: string[];
  categoryId?: string;
}

// 审核快捷键配置
export interface ReviewShortcuts {
  approve: string;
  reject: string;
  next: string;
  previous: string;
  toggleSelect: string;
  batchApprove: string;
  batchReject: string;
  quickTags: string;
  fullscreen: string;
}

// 审核列表视图模式
export type ReviewViewMode = 'grid' | 'list' | 'detail';

// 审核操作类型
export type ReviewAction =
  | 'approve'
  | 'reject'
  | 'pending'
  | 'private'
  | 'batch-approve'
  | 'batch-reject'
  | 'batch-tags'
  | 'batch-category'
  | 'delete';

// 审核上下文
export interface ReviewContext {
  selectedItems: Set<string>;
  currentItem?: string;
  viewMode: ReviewViewMode;
  filters: ReviewFilters;
  stats: ReviewStats | null;
  isLoading: boolean;
  shortcuts: ReviewShortcuts;
} 