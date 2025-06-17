'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { authService } from '@/services/auth.service';
import { handleApiError } from '@/lib/utils/error-handler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
}

export default function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 验证表单
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 8) {
      setError('密码长度至少为8个字符');
      return;
    }

    setIsLoading(true);

    try {
      // 使用 authService.register 进行注册
      const response = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname || undefined,
      });

      // 注册成功后自动登录
      const loginResult = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError('注册成功，但登录失败，请尝试手动登录');
        setIsLoading(false);
        router.push('/login');
        return;
      }

      // 登录成功，跳转到首页
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('注册错误:', error);
      setError(handleApiError(error, '注册失败，请稍后重试'));
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">
          用户名 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={formData.username}
          onChange={handleChange}
          placeholder="请输入用户名"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          电子邮箱 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="请输入电子邮箱"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">
          昵称
        </Label>
        <Input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          value={formData.nickname}
          onChange={handleChange}
          placeholder="请输入您的昵称（可选）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          密码 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={formData.password}
          onChange={handleChange}
          placeholder="请输入密码（至少8个字符）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          确认密码 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="请再次输入密码"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? '注册中...' : '注册账号'}
      </Button>
    </form>
  );
} 