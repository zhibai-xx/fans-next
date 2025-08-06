import { useSession } from 'next-auth/react';
import {
  useUser,
  useIsAuthenticated,
  useIsAdmin,
  useAuthLoading,
  useAuthStore
} from '@/store/auth.store';

// 保持向后兼容的User接口，映射到Zustand的User类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  nickname?: string;
  avatar_url?: string;
}

export function useAuth() {
  const { data: session, status } = useSession();

  // 从Zustand获取状态
  const zustandUser = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const isAdminUser = useIsAdmin();
  // 直接使用store中的hasPermission方法，而不是hook
  const authStore = useAuthStore();

  // 转换Zustand用户格式为兼容格式
  const user: User | null = zustandUser ? {
    id: zustandUser.uuid || zustandUser.id.toString(),
    username: zustandUser.username,
    email: zustandUser.email,
    role: zustandUser.role,
    nickname: zustandUser.nickname,
    avatar_url: zustandUser.avatar_url,
  } : null;

  // 权限检查函数 - 使用Zustand的逻辑
  const hasRole = (role: 'USER' | 'ADMIN'): boolean => {
    if (!zustandUser) return false;
    return zustandUser.role === role;
  };

  const isAdmin = (): boolean => {
    return isAdminUser;
  };

  const isUser = (): boolean => {
    return hasRole('USER');
  };

  // 检查是否有特定功能的权限 - 使用Zustand的权限系统
  const hasPermission = (permission: string): boolean => {
    // 映射旧权限名到新权限名
    const permissionMap: Record<string, string> = {
      'weibo-import': 'ADMIN_ACCESS',
      'admin-panel': 'ADMIN_ACCESS',
      'admin-dashboard': 'ADMIN_ACCESS',
      'user-management': 'USER_MANAGEMENT',
      'media-review': 'REVIEW_MANAGEMENT',
      'admin-logs': 'SYSTEM_MONITORING',
      'admin-settings': 'ADMIN_ACCESS',
      'upload-media': 'MEDIA_MANAGEMENT',
      'comment': 'USER_ACCESS',
      'favorite': 'USER_ACCESS',
    };

    const mappedPermission = permissionMap[permission];
    if (!mappedPermission) return false;

    return authStore.hasPermission(mappedPermission);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    isAdmin,
    isUser,
    hasPermission,
    session,
    status
  };
} 