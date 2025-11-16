'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { UpdateProfileRequest } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAvatarUploadMutation, useProfileForm } from '@/hooks/queries/useProfile';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { AvatarCropperDialog } from '@/components/avatar/AvatarCropperDialog';

const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(size / 1024).toFixed(1)} KB`;
};

export default function ProfileForm() {
  const { update } = useSession();
  const {
    profile,
    isLoading: isFetching,
    error: profileError,
    initialFormData,
    updateProfile,
    isUpdating,
    updateError,
  } = useProfileForm();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useAvatarUploadMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateProfileRequest>(initialFormData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pendingCrop, setPendingCrop] = useState<{
    src: string;
    fileName: string;
    fileType: string;
  } | null>(null);

  // 当profile数据加载完成后，更新表单数据
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (pendingCrop) {
        URL.revokeObjectURL(pendingCrop.src);
      }
    };
  }, [avatarPreview, pendingCrop]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetAvatarSelection = (options?: { preserveError?: boolean }) => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    if (pendingCrop) {
      URL.revokeObjectURL(pendingCrop.src);
      setPendingCrop(null);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsCropperOpen(false);
    if (!options?.preserveError) {
      setAvatarError(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('仅支持 JPG、PNG 或 WebP 格式的头像');
      resetAvatarSelection({ preserveError: true });
      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      setAvatarError('头像大小不能超过 2MB');
      resetAvatarSelection({ preserveError: true });
      return;
    }

    setAvatarError(null);
    if (pendingCrop) {
      URL.revokeObjectURL(pendingCrop.src);
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingCrop({
      src: previewUrl,
      fileName: file.name,
      fileType: file.type,
    });
    setIsCropperOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropClose = () => {
    if (pendingCrop) {
      URL.revokeObjectURL(pendingCrop.src);
    }
    setPendingCrop(null);
    setIsCropperOpen(false);
    if (!avatarFile) {
      setAvatarError('请完成裁剪后再上传');
    }
  };

  const handleCropComplete = (file: File, previewUrl: string) => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    if (pendingCrop) {
      URL.revokeObjectURL(pendingCrop.src);
    }
    setPendingCrop(null);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setIsCropperOpen(false);
    setAvatarError(null);
  };

  const handleAvatarUpload = () => {
    if (!avatarFile || isUploadingAvatar) {
      return;
    }

    uploadAvatar(avatarFile, {
      onSuccess: async (updatedProfile) => {
        await update({
          user: {
            name: updatedProfile.nickname || updatedProfile.username,
            email: updatedProfile.email || profile?.email,
            image: updatedProfile.avatar_url || profile?.avatar_url,
            avatar_url: updatedProfile.avatar_url || profile?.avatar_url,
          },
        });
        resetAvatarSelection();
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(null);

    updateProfile(formData, {
      onSuccess: async (updatedProfile) => {
        setSuccess('个人资料更新成功');

        // 更新NextAuth会话信息
        await update({
          user: {
            name: updatedProfile.nickname || updatedProfile.username,
            email: updatedProfile.email || profile?.email,
            image: updatedProfile.avatar_url || profile?.avatar_url,
            avatar_url: updatedProfile.avatar_url || profile?.avatar_url,
          },
        });
      },
    });
  };

  // 显示加载状态
  if (isFetching) {
    return (
      <div className="py-8">
        <LoadingSpinner className="justify-center" />
      </div>
    );
  }

  // 显示错误
  if (profileError && !profile) {
    return (
      <div className="py-8 text-center">
        <div className="text-red-500 p-4 bg-red-50 rounded-md">
          {profileError.message || '获取用户资料失败，请刷新页面重试'}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {updateError && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {updateError.message || '更新资料失败，请稍后重试'}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-500 p-4 rounded-md mb-6">
          {success}
        </div>
      )}

      <div className="space-y-3">
        <Label>头像</Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <UserAvatar
            src={avatarPreview || profile?.avatar_url}
            name={profile?.nickname || profile?.username || '用户'}
            size="xl"
            withBorder
            className="border-dashed border-border"
          />
          <div className="flex-1 space-y-2">
            <Input
              ref={fileInputRef}
              id="avatarFile"
              type="file"
              accept={ACCEPTED_AVATAR_TYPES.join(',')}
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                选择图片
              </Button>
              <Button
                type="button"
                disabled={!avatarFile || isUploadingAvatar}
                onClick={handleAvatarUpload}
              >
                {isUploadingAvatar ? '上传中...' : '上传头像'}
              </Button>
              {avatarFile && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => resetAvatarSelection()}
                  disabled={isUploadingAvatar}
                >
                  取消选择
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              支持 JPG / PNG / WebP，最大 2MB，系统会自动裁剪并压缩为 WebP。
            </p>
            {avatarFile && (
              <p className="text-xs text-muted-foreground">
                已选择：{avatarFile.name}（{formatFileSize(avatarFile.size)}）
              </p>
            )}
            {avatarError && (
              <p className="text-xs text-red-500">{avatarError}</p>
            )}
          </div>
        </div>
      </div>

      <AvatarCropperDialog
        open={isCropperOpen}
        imageSrc={pendingCrop?.src || null}
        fileName={pendingCrop?.fileName}
        fileType={pendingCrop?.fileType}
        onClose={handleCropClose}
        onCropComplete={handleCropComplete}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="username">
            用户名
          </Label>
          <Input
            id="username"
            type="text"
            disabled
            value={profile?.username || ''}
            className="bg-gray-100 opacity-70 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500">用户名创建后不可修改</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">
            昵称
          </Label>
          <Input
            id="nickname"
            name="nickname"
            type="text"
            value={formData.nickname}
            onChange={handleChange}
            placeholder="设置您的昵称"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            电子邮箱
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="设置您的邮箱"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            手机号码
          </Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="设置您的手机号"
          />
        </div>
      </div>

      {/* <div className="space-y-2">
        <label 
          htmlFor="bio" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          个人简介
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio || ''}
          onChange={handleChange}
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          placeholder="介绍一下自己吧"
        />
      </div> */}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isUpdating}
        >
          {isUpdating ? '保存中...' : '保存修改'}
        </Button>
      </div>
    </form>
  );
} 
