'use client';

import { ReviewDashboard } from './components/ReviewDashboard';

export default function ReviewPage() {
  // 权限检查已在父布局 (AdminLayout) 中处理
  return (
    <div>
      <ReviewDashboard />
    </div>
  );
} 