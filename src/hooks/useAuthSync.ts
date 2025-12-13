import { useSession } from 'next-auth/react';
import { useCallback, useEffect } from 'react';
import { useAuthStore, type User } from '@/store/auth.store';

/**
 * 同步NextAuth状态到Zustand Store的Hook
 * 这个hook负责将NextAuth的session状态同步到我们的全局认证状态中
 */
export function useAuthSync() {
  const { data: session, status } = useSession();
  const { setUser, setLoading } = useAuthStore();

  const mapSessionUserToStoreUser = useCallback((sessionUser: Record<string, unknown>): User => {
    const rawId = sessionUser.id;
    const parsedId =
      typeof rawId === 'number'
        ? rawId
        : typeof rawId === 'string'
        ? Number(rawId)
        : 0;

    const role = sessionUser.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const statusValue = sessionUser.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
    const uuid = typeof sessionUser.uuid === 'string' ? sessionUser.uuid : '';
    const username = typeof sessionUser.username === 'string' ? sessionUser.username : '';
    const email = typeof sessionUser.email === 'string' ? sessionUser.email : '';
    const nickname = typeof sessionUser.nickname === 'string' ? sessionUser.nickname : undefined;
    const avatarUrl =
      typeof sessionUser.avatar_url === 'string'
        ? sessionUser.avatar_url
        : typeof sessionUser.image === 'string'
        ? sessionUser.image
        : undefined;

    const createdAt =
      typeof sessionUser.created_at === 'string'
        ? sessionUser.created_at
        : new Date().toISOString();

    const updatedAt =
      typeof sessionUser.updated_at === 'string'
        ? sessionUser.updated_at
        : new Date().toISOString();

    return {
      id: Number.isNaN(parsedId) ? 0 : parsedId,
      uuid,
      username,
      email,
      role,
      status: statusValue,
      avatar_url: avatarUrl,
      nickname,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  }, []);

  useEffect(() => {
    // 设置加载状态
    setLoading(status === 'loading');

    // 同步用户数据
    if (status === 'authenticated' && session?.user) {
      setUser(mapSessionUserToStoreUser(session.user as Record<string, unknown>));
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status, setUser, setLoading, mapSessionUserToStoreUser]);

  return { session, status };
}
