import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 用户类型定义
export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  avatar_url?: string;
  nickname?: string;
  created_at: string;
  updated_at: string;
}

// 认证状态接口
interface AuthState {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 操作
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;

  // 辅助方法
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
}

// 权限配置
const PERMISSIONS = {
  ADMIN_ACCESS: ['ADMIN'],
  USER_MANAGEMENT: ['ADMIN'],
  MEDIA_MANAGEMENT: ['ADMIN'],
  REVIEW_MANAGEMENT: ['ADMIN'],
  SYSTEM_MONITORING: ['ADMIN'],
} as const;

// 创建认证 store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      isLoading: true, // 初始加载状态

      // 设置用户
      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      // 设置加载状态
      setLoading: (loading) => set({ isLoading: loading }),

      // 登录
      login: (user) => set({
        user,
        isAuthenticated: true,
        isLoading: false
      }),

      // 登出
      logout: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      }),

      // 更新用户信息
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),

      // 检查是否为管理员
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'ADMIN' && user?.status === 'ACTIVE';
      },

      // 检查权限
      hasPermission: (permission) => {
        const { user, isAdmin } = get();
        if (!user || user.status !== 'ACTIVE') return false;

        // 管理员拥有所有权限
        if (isAdmin()) return true;

        // 检查特定权限
        const allowedRoles = PERMISSIONS[permission as keyof typeof PERMISSIONS];
        return allowedRoles ? allowedRoles.includes(user.role) : false;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      skipHydration: true, // 跳过 SSR hydration，避免服务端和客户端状态不一致
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // 不持久化 isLoading 状态
      }),
    }
  )
);

// 选择器 hooks（用于性能优化）
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAdmin = () => useAuthStore((state) => state.isAdmin());
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

// 权限相关 hooks
export const useHasPermission = (permission: string) =>
  useAuthStore((state) => state.hasPermission(permission));

export const useRequireAuth = () => {
  const { isAuthenticated, user } = useAuthStore();
  return { isAuthenticated, user, isRequired: !isAuthenticated };
};

export const useRequireAdmin = () => {
  const { isAuthenticated, isAdmin } = useAuthStore();
  return {
    isAuthenticated,
    isAdmin: isAdmin(),
    isRequired: !isAuthenticated || !isAdmin()
  };
};