'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useAuthSync } from '@/hooks/useAuthSync';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';

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