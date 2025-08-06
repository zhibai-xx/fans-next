'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminHomePage() {
  const router = useRouter();

  useEffect(() => {
    // 自动跳转到管理后台仪表板
    router.replace('/admin/dashboard');
  }, [router]);

  // 显示加载状态，直到跳转完成
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到管理后台...</p>
      </div>
    </div>
  );
}