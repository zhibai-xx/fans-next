'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthSync } from '@/hooks/useAuthSync';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { toast } from '@/hooks/use-toast';

// 内部组件用于在SessionProvider内部使用useAuthSync
function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  // 同步NextAuth状态到Zustand
  useAuthSync();

  // 手动触发 hydration，解决 SSR 不一致问题
  useEffect(() => {
    // 这会触发 Zustand persist 的 rehydration
    useAuthStore.persist.rehydrate();
    useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const handleAuthExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message =
        customEvent.detail?.message || '登录状态已失效，建议重新登录后继续操作';

      useAuthStore.getState().logout();

      toast({
        title: '登录状态已失效',
        description: message,
        variant: 'destructive',
      });
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSyncProvider>
        {children}
      </AuthSyncProvider>
    </SessionProvider>
  );
} 
