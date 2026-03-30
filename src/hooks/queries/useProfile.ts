import { useQuery, useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { userService, UserProfile, UpdateProfileRequest } from '@/services/user.service';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore, useUser } from '@/store/auth.store';
import { queryUtils } from '@/lib/query-client';
import { mergeProfileIntoStoreUser } from '@/lib/auth/user-mappers';
import { profileQueryKeys, profileQueryOptions } from '@/hooks/queries/profile-query-options';

type UpdateProfileMutate = (
  variables: UpdateProfileRequest,
  options?: {
    onSuccess?: (updatedProfile: UserProfile) => void | Promise<void>;
    onError?: (error: Error) => void;
  },
) => void;

type ProfileFormState = {
  profile: UserProfile | undefined;
  isLoading: boolean;
  error: Error | null;
  initialFormData: UpdateProfileRequest;
  updateProfile: UpdateProfileMutate;
  isUpdating: boolean;
  updateError: Error | null;
};

// Get user profile
export const useUserProfile = () => {
  const user = useUser();
  const isAuthenticated = Boolean(user);

  return useQuery({
    ...profileQueryOptions.profile(isAuthenticated),
    enabled: isAuthenticated,
  });
};

// Update user profile mutation
export const useUpdateProfileMutation = () => {
  const { toast } = useToast();
  const { setUser } = useAuthStore();

  return useMutation<UserProfile, Error, UpdateProfileRequest>({
    mutationFn: async (updates: UpdateProfileRequest) => {
      // 过滤掉空字符串字段
      const filteredData = Object.entries(updates).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed !== '') {
            acc[key as keyof UpdateProfileRequest] = trimmed;
          }
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
      setUser(mergeProfileIntoStoreUser(currentUser, updatedProfile));

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

// Avatar upload mutation
export const useAvatarUploadMutation = () => {
  const { toast } = useToast();
  const { setUser } = useAuthStore();

  return useMutation<UserProfile, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return userService.uploadAvatar(formData);
    },
    onSuccess: (updatedProfile) => {
      toast({
        title: '头像更新成功',
        description: '新头像已应用到全站',
      });

      const currentUser = useAuthStore.getState().user;
      setUser(mergeProfileIntoStoreUser(currentUser, updatedProfile));

      queryUtils.invalidateQuery(profileQueryKeys.profile);
    },
    onError: (error: Error) => {
      toast({
        title: '头像更新失败',
        description: error.message || '上传头像失败，请稍后重试',
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
  const user = useUser();
  const isAuthenticated = Boolean(user);

  return useQuery({
    ...profileQueryOptions.downloads(isAuthenticated),
    enabled: isAuthenticated,
  });
};

// Get user favorites
export const useUserFavorites = () => {
  const user = useUser();
  const isAuthenticated = Boolean(user);

  return useQuery({
    ...profileQueryOptions.favorites(isAuthenticated),
    enabled: isAuthenticated,
  });
};

// Get user uploads with pagination
export const useUserUploads = (page: number = 1, limit: number = 20) => {
  const user = useUser();
  const isAuthenticated = Boolean(user);

  return useQuery({
    ...profileQueryOptions.uploads(isAuthenticated, page, limit),
    enabled: isAuthenticated,
  });
};

// Profile form state management hook
export const useProfileForm = (): ProfileFormState => {
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useUserProfile();
  const updateProfileMutation = useUpdateProfileMutation();

  // 使用 useMemo 缓存初始表单数据，避免无限循环
  const initialFormData = useMemo((): UpdateProfileRequest => {
    if (!profile) {
      return {
        nickname: '',
        email: '',
        phoneNumber: '',
      };
    }

    return {
      nickname: profile.nickname || profile.username || '',
      email: profile.email || '',
      phoneNumber: profile.phoneNumber || '',
    };
  }, [profile]);

  return {
    profile,
    isLoading: isProfileLoading,
    error: profileError ?? null,
    initialFormData,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error ?? null,
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
