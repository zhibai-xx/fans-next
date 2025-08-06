import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

/**
 * 同步NextAuth状态到Zustand Store的Hook
 * 这个hook负责将NextAuth的session状态同步到我们的全局认证状态中
 */
export function useAuthSync() {
  const { data: session, status } = useSession();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // 设置加载状态
    setLoading(status === 'loading');

    // 同步用户数据
    if (status === 'authenticated' && session?.user) {
      const user = {
        id: (session.user as any).id || 0,
        uuid: (session.user as any).uuid || '',
        username: (session.user as any).username || '',
        email: session.user.email || '',
        role: ((session.user as any).role || 'USER') as 'USER' | 'ADMIN',
        status: ((session.user as any).status || 'ACTIVE') as 'ACTIVE' | 'SUSPENDED',
        avatar_url: (session.user as any).avatar_url || session.user.image,
        nickname: (session.user as any).nickname,
        created_at: (session.user as any).created_at || new Date().toISOString(),
        updated_at: (session.user as any).updated_at || new Date().toISOString(),
      };

      setUser(user);
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status, setUser, setLoading]);

  return { session, status };
}