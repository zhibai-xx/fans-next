import { useQuery, useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { userService, UserProfile, UpdateProfileRequest } from '@/services/user.service';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import { queryUtils } from '@/lib/query-client';

// Profile-related query keys
export const profileQueryKeys = {
  profile: ['profile'] as const,
  downloads: ['profile', 'downloads'] as const,
  favorites: ['profile', 'favorites'] as const,
  uploads: ['profile', 'uploads'] as const,
  weiboImports: ['profile', 'weibo-imports'] as const,
};

// Get user profile
export const useUserProfile = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery<UserProfile, Error>({
    queryKey: profileQueryKeys.profile,
    queryFn: async () => {
      if (!isAuthenticated) {
        throw new Error('用户未登录');
      }
      return await userService.getProfile();
    },
    enabled: isAuthenticated, // 只有在认证时才执行查询
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // 如果是认证错误，不要重试
      if (error.message.includes('未登录') || error.message.includes('过期')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Update user profile mutation
export const useUpdateProfileMutation = () => {
  const { toast } = useToast();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: UpdateProfileRequest) => {
      // 过滤掉空字符串字段
      const filteredData = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value && value.trim() !== '') {
          acc[key as keyof UpdateProfileRequest] = value;
        }
        return acc;
      }, {} as UpdateProfileRequest);

      return await userService.updateProfile(filteredData);
    },
    onSuccess: (updatedProfile) => {
      toast({
        title: '更新成功',
        description: '个人资料已更新',
      });

      // 更新Zustand中的用户信息
      const currentUser = useAuthStore.getState().user;
      if (currentUser && updatedProfile.user) {
        setUser({
          ...currentUser,
          username: updatedProfile.user.username,
          email: updatedProfile.user.email || currentUser.email,
          nickname: updatedProfile.user.nickname || currentUser.nickname,
          avatar_url: updatedProfile.user.avatar || updatedProfile.user.avatar_url || currentUser.avatar_url,
        });
      }

      // 使profile查询失效，触发重新获取
      queryUtils.invalidateQuery(profileQueryKeys.profile);
    },
    onError: (error: Error) => {
      toast({
        title: '更新失败',
        description: error.message || '更新个人资料失败，请稍后重试',
        variant: 'destructive',
      });
    },
  });
};

// Change password mutation
export const useChangePasswordMutation = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('新密码与确认密码不匹配');
      }

      return await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: '密码修改成功',
        description: '您的密码已成功修改',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '密码修改失败',
        description: error.message || '修改密码失败，请检查当前密码是否正确',
        variant: 'destructive',
      });
    },
  });
};

// Get user downloads
export const useUserDownloads = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: profileQueryKeys.downloads,
    queryFn: async () => {
      if (!isAuthenticated) {
        throw new Error('用户未登录');
      }
      // 这里需要实现下载记录的API
      return [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get user favorites
export const useUserFavorites = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: profileQueryKeys.favorites,
    queryFn: async () => {
      if (!isAuthenticated) {
        throw new Error('用户未登录');
      }
      // 这里需要实现收藏记录的API
      return [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get user uploads with pagination
export const useUserUploads = (page: number = 1, limit: number = 20) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: [...profileQueryKeys.uploads, page, limit],
    queryFn: async () => {
      if (!isAuthenticated) {
        throw new Error('用户未登录');
      }
      // 这里需要实现用户上传记录的API
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
};

// Profile form state management hook
export const useProfileForm = () => {
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useUserProfile();
  const updateProfileMutation = useUpdateProfileMutation();

  // 使用 useMemo 缓存初始表单数据，避免无限循环
  const initialFormData = useMemo((): UpdateProfileRequest => {
    if (!profile) {
      return {
        nickname: '',
        email: '',
        phoneNumber: '',
        avatar: '',
      };
    }

    return {
      nickname: profile.nickname || profile.username || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
      avatar: profile.avatar || profile.avatar_url || '',
    };
  }, [profile]);

  return {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    initialFormData,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
  };
};

// Password form state management hook
export const usePasswordForm = () => {
  const changePasswordMutation = useChangePasswordMutation();

  return {
    changePassword: changePasswordMutation.mutate,
    isChanging: changePasswordMutation.isPending,
    error: changePasswordMutation.error,
    isSuccess: changePasswordMutation.isSuccess,
    reset: changePasswordMutation.reset,
  };
};