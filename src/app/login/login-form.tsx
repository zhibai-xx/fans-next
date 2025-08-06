'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '@/hooks/mutations/useAuthMutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const loginMutation = useLoginMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    loginMutation.mutate(formData, {
      onSuccess: () => {
        // 登录成功后跳转
        router.push('/');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loginMutation.error && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md mb-4">
          {loginMutation.error.message || '登录失败，请稍后重试'}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">
          用户名或邮箱
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={formData.username}
          onChange={handleChange}
          placeholder="请输入用户名或邮箱"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">
            密码
          </Label>
          <a
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            忘记密码？
          </a>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="请输入密码"
        />
      </div>

      <Button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full"
      >
        {loginMutation.isPending ? '登录中...' : '登录'}
      </Button>
    </form>
  );
} 