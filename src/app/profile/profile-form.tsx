'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { userService, UserProfile, UpdateProfileRequest } from '@/services/user.service';
import { handleApiError } from '@/lib/utils/error-handler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfileForm() {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    nickname: '',
    email: '',
    phoneNumber: '',
    // bio: '',
    avatar: '',
  });

  // 获取用户资料
  useEffect(() => {
    // 只有当会话加载完成且用户已认证时才获取资料
    if (status === 'loading') {
      return; // 会话正在加载中，不执行任何操作
    }

    const fetchProfile = async () => {
      if (status !== 'authenticated' || !session?.accessToken) {
        setIsFetching(false);
        setError('用户未登录或登录已过期');
        return;
      }

      try {
        const response = await userService.getProfile();
        setProfile(response);

        // 填充表单
        setFormData({
          nickname: response.nickname || response.username || '',
          email: response.email || '',
          phoneNumber: response.phoneNumber || '',
          avatar: response.avatar || response.avatar_url || '',
          // bio: response.bio || '',
        });

      } catch (error) {
        console.error('获取用户资料失败:', error);
        setError(handleApiError(error, '获取用户资料失败，请刷新页面重试'));
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [session, status]); // 添加 status 作为依赖

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (status !== 'authenticated' || !session?.accessToken) {
      setError('用户未登录或登录已过期');
      setIsLoading(false);
      return;
    }

    try {
      // 过滤掉空字符串字段
      const filteredData = Object.entries(formData).reduce((acc, [key, value]) => {
        // 只保留有值的字段
        if (value && value.trim() !== '') {
          acc[key as keyof UpdateProfileRequest] = value;
        }
        return acc;
      }, {} as UpdateProfileRequest);

      // 发送请求
      const response = await userService.updateProfile(filteredData);
      setSuccess('个人资料更新成功');

      // 更新会话信息
      if (session && session.user) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: formData.nickname || null,
            email: formData.email || null,
            image: formData.avatar || null,
          },
        });
      }

    } catch (error) {
      console.error('更新资料错误:', error);
      setError(handleApiError(error, '更新资料失败，请稍后重试'));
    } finally {
      setIsLoading(false);
    }
  };

  // 显示加载状态
  if (status === 'loading' || isFetching) {
    return <div className="py-8 text-center">加载中...</div>;
  }

  // 显示未登录错误
  if (status === 'unauthenticated') {
    return (
      <div className="py-8 text-center">
        <div className="text-red-500 p-4 bg-red-50 rounded-md">用户未登录或登录已过期</div>
      </div>
    );
  }

  // 显示其他错误
  if (error && !profile) {
    return (
      <div className="py-8 text-center">
        <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
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
          disabled={isLoading}
        >
          {isLoading ? '保存中...' : '保存修改'}
        </Button>
      </div>
    </form>
  );
} 