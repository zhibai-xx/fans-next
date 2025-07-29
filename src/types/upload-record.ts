export interface UploadRecord {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  size: number;            // 文件大小（字节）
  media_type: 'IMAGE' | 'VIDEO';
  duration?: number;       // 视频时长（秒）
  width?: number;          // 宽度
  height?: number;         // 高度
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE';
  review_comment?: string; // 审核备注
  reviewed_by?: number;    // 审核员ID
  reviewed_at?: string;    // 审核时间
  reviewer?: {             // 审核员信息
    id: number;
    username: string;
    nickname?: string;
  };
  views: number;           // 浏览量
  likes_count: number;     // 点赞数
  category?: {             // 分类信息
    id: string;
    name: string;
  };
  tags: Array<{            // 标签信息
    id: string;
    name: string;
  }>;
  created_at: string;      // 上传时间
  updated_at: string;      // 更新时间
}

export interface UploadStats {
  total: number;           // 总上传数
  pending: number;         // 待审核
  approved: number;        // 已通过
  rejected: number;        // 已拒绝
  private: number;         // 已暂存
  total_views: number;     // 总浏览量
  total_likes: number;     // 总点赞数
  approval_rate: number;   // 通过率（百分比）
}

export interface UploadFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE';
  media_type?: 'IMAGE' | 'VIDEO';
  search?: string;
  category_id?: string;
  sortBy?: 'created_at' | 'title' | 'views' | 'likes_count' | 'reviewed_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UploadRecordResponse {
  records: UploadRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  stats: UploadStats;
}

export interface ResubmitData {
  title?: string;
  description?: string;
  category_id?: string;
  tag_ids?: string[];
} 