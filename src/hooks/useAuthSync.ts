import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { mapSessionUserToStoreUser } from '@/lib/auth/user-mappers';

/**
 * 同步NextAuth状态到Zustand Store的Hook
 * 这个hook负责将NextAuth的session状态同步到我们的全局认证状态中
 */
export function useAuthSync() {
  const { data: session, status } = useSession();
  const { setUser, setLoading } = useAuthStore();
  const hasHandledExpiredSession = useRef(false);

  const isJwtExpired = useCallback((token: string): boolean => {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return false;
      }
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = atob(normalizedPayload);
      const parsedPayload = JSON.parse(decodedPayload) as { exp?: number };
      if (!parsedPayload.exp) {
        return false;
      }
      return parsedPayload.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // 设置加载状态
    setLoading(status === 'loading');

    // 同步用户数据
    if (status === 'authenticated' && session?.accessToken) {
      if (isJwtExpired(session.accessToken)) {
        setUser(null);
        if (!hasHandledExpiredSession.current) {
          hasHandledExpiredSession.current = true;
          void signOut({ redirect: false }).finally(() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('auth:expired', {
                  detail: { message: '登录凭证已过期，请重新登录' },
                })
              );
            }
          });
        }
        return;
      }

      hasHandledExpiredSession.current = false;
      setUser(mapSessionUserToStoreUser(session.user as Record<string, unknown>));
    } else if (status === 'authenticated' && !session?.accessToken) {
      setUser(null);
      if (!hasHandledExpiredSession.current) {
        hasHandledExpiredSession.current = true;
        void signOut({ redirect: false }).finally(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('auth:expired', {
                detail: {
                  message:
                    session?.authError === 'REFRESH_ACCESS_TOKEN_ERROR'
                      ? '登录状态已失效，请重新登录'
                      : '当前会话不可用，请重新登录',
                },
              })
            );
          }
        });
      }
    } else if (status === 'unauthenticated') {
      setUser(null);
      hasHandledExpiredSession.current = false;
    }
  }, [session, status, setUser, setLoading, isJwtExpired]);

  return { session, status };
}
