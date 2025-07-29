'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PermissionGuardProps {
  permission?: string;
  role?: 'USER' | 'ADMIN';
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  showFallback?: boolean;
}

export function PermissionGuard({
  permission,
  role,
  children,
  fallback,
  requireAuth = false,
  showFallback = true
}: PermissionGuardProps) {
  const { isAuthenticated, hasPermission, hasRole, isLoading } = useAuth();

  // 加载状态
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 rounded-md h-20" />;
  }

  // 检查登录状态
  if (requireAuth && !isAuthenticated) {
    return showFallback ? (
      fallback || (
        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">请先登录以访问此功能</p>
          </CardContent>
        </Card>
      )
    ) : null;
  }

  // 检查角色权限
  if (role && !hasRole(role)) {
    return showFallback ? (
      fallback || (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                权限不足
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              此功能需要 <strong>{role === 'ADMIN' ? '管理员' : '用户'}</strong> 权限才能访问
            </p>
          </CardContent>
        </Card>
      )
    ) : null;
  }

  // 检查具体权限
  if (permission && !hasPermission(permission)) {
    return showFallback ? (
      fallback || (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Badge variant="outline" className="bg-red-100 text-red-800">
                访问受限
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              您没有访问此功能的权限。如需帮助，请联系管理员。
            </p>
          </CardContent>
        </Card>
      )
    ) : null;
  }

  // 权限验证通过，渲染子组件
  return <>{children}</>;
}

// 便捷的管理员专用组件
export function AdminOnly({
  children,
  fallback,
  showFallback = true
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <PermissionGuard
      role="ADMIN"
      showFallback={showFallback}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

// 便捷的认证用户专用组件
export function AuthOnly({
  children,
  fallback,
  showFallback = true
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}) {
  return (
    <PermissionGuard
      requireAuth={true}
      showFallback={showFallback}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
} 