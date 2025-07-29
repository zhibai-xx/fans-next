import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

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

  const user: User | null = useMemo(() => {
    if (!session?.user) return null;

    return {
      id: (session.user as any).id || (session.user as any).uuid,
      username: (session.user as any).username || '',
      email: session.user.email || '',
      role: (session.user as any).role || 'USER',
      nickname: (session.user as any).nickname,
      avatar_url: (session.user as any).avatar_url || session.user.image,
    };
  }, [session]);

  const isAuthenticated = status === 'authenticated' && !!user;
  const isLoading = status === 'loading';

  // 权限检查函数
  const hasRole = (role: 'USER' | 'ADMIN'): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  const isUser = (): boolean => {
    return hasRole('USER');
  };

  // 检查是否有特定功能的权限
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    switch (permission) {
      case 'weibo-import':
      case 'admin-panel':
      case 'user-management':
      case 'media-review':
        return isAdmin();

      case 'upload-media':
      case 'comment':
      case 'favorite':
        return isAuthenticated;

      default:
        return false;
    }
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