import { useMutation } from '@tanstack/react-query';
import { signIn, signOut } from 'next-auth/react';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/hooks/use-toast';
import { queryUtils } from '@/lib/query-client';

// 登录mutation
export const useLoginMutation = () => {
  const { toast } = useToast();
  const { setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      setLoading(true);

      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error(result?.error || '登录失败');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: '登录成功',
        description: '欢迎回来！',
      });

      // 清除所有查询缓存，重新获取用户相关数据
      queryUtils.invalidateAll();
    },
    onError: (error: Error) => {
      toast({
        title: '登录失败',
        description: error.message || '用户名或密码错误',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// 登出mutation
export const useLogoutMutation = () => {
  const { toast } = useToast();
  const { logout, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      setLoading(true);
      await signOut({ redirect: false });
    },
    onSuccess: () => {
      // 清除Zustand中的用户状态
      logout();

      toast({
        title: '已退出登录',
        description: '期待您的再次光临',
      });

      // 清除所有查询缓存
      queryUtils.invalidateAll();
    },
    onError: (error: Error) => {
      toast({
        title: '退出登录失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// 更新用户信息mutation
export const useUpdateUserMutation = () => {
  const { toast } = useToast();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: Partial<{ username: string; email: string; nickname: string }>) => {
      // 这里应该调用实际的API来更新用户信息
      // 暂时模拟一个成功的响应
      return { success: true, data: updates };
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        updateUser(data.data);
        toast({
          title: '更新成功',
          description: '用户信息已更新',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: '更新失败',
        description: error.message || '更新用户信息失败',
        variant: 'destructive',
      });
    },
  });
};

// 检查认证状态
export const useAuthCheck = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  return {
    isAuthenticated,
    user,
    isLoading,
    requireAuth: () => {
      if (!isAuthenticated && !isLoading) {
        throw new Error('需要登录才能访问此功能');
      }
    },
    requireAdmin: () => {
      if (!isAuthenticated && !isLoading) {
        throw new Error('需要登录才能访问此功能');
      }
      if (user?.role !== 'ADMIN') {
        throw new Error('需要管理员权限才能访问此功能');
      }
    },
  };
};