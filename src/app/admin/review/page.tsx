'use client';

import { useAuth } from '@/hooks/useAuth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ReviewDashboard } from './components/ReviewDashboard';

export default function ReviewPage() {
  return (
    <PermissionGuard
      permission="media-review"
      requireAuth={true}
      fallback={
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">访问受限</h1>
            <p className="text-gray-600">
              您需要管理员权限才能访问审核页面
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <ReviewDashboard />
      </div>
    </PermissionGuard>
  );
} 