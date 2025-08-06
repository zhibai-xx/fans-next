'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // 响应式侧边栏状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 检测屏幕大小并智能调整侧边栏状态
  useEffect(() => {
    const handleResize = () => {
      // 在屏幕宽度小于1024px时默认收起侧边栏（移动端）
      // 在大屏幕上默认展开侧边栏
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        // 在更大的屏幕上（xl断点）默认展开
        setSidebarCollapsed(false);
      }
    };

    // 初始检查
    handleResize();

    // 添加窗口大小变化监听器
    window.addEventListener('resize', handleResize);

    // 清理监听器
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <PermissionGuard
      permission="admin-panel"
      requireAuth={true}
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">访问受限</h1>
            <p className="text-gray-600 mb-6">
              您需要管理员权限才能访问后台管理系统
            </p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      }
    >
      <div className="flex h-screen bg-gray-50 relative">
        {/* 移动端遮罩层 */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* 侧边栏 */}
        <div className={`${sidebarCollapsed ? 'lg:flex' : 'flex'} ${sidebarCollapsed && 'hidden lg:flex'}`}>
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 头部导航 */}
          <AdminHeader
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            sidebarCollapsed={sidebarCollapsed}
          />

          {/* 页面内容 */}
          <main
            className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50"
            data-sidebar-collapsed={sidebarCollapsed}
          >
            <div className="min-w-0 px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
              <div className="w-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </PermissionGuard>
  );
}