'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UpdateProfileRequest } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useProfileForm } from '@/hooks/queries/useProfile';

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

  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateProfileRequest>(initialFormData);

  // 当profile数据加载完成后，更新表单数据
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
            email: updatedProfile.email,
            image: updatedProfile.avatar || updatedProfile.avatar_url,
          },
        });

        console.log('更新成功:', updatedProfile);
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
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            电子邮箱
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="设置您的邮箱"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            手机号码
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="设置您的手机号"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="avatar"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          头像URL
        </label>
        <input
          id="avatar"
          name="avatar"
          type="url"
          value={formData.avatar}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          placeholder="输入头像图片URL"
        />
        <p className="text-xs text-gray-500">输入图片的网络地址，例如：https://example.com/avatar.jpg</p>
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