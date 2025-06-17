'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { userService, ChangePasswordRequest } from '@/services/user.service';
import { handleApiError } from '@/lib/utils/error-handler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PasswordForm() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 验证表单
    if (formData.newPassword.length < 8) {
      setError('新密码长度至少为8个字符');
      return;
    }

    if (formData.newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setIsLoading(true);
    if (!session?.user.id) {
      setError('用户未登录或登录已过期');
      setIsLoading(false);
      return;
    }

    try {
      await userService.changePassword(formData);
      setSuccess('密码修改成功');
      // 清空表单
      setFormData({
        currentPassword: '',
        newPassword: '',
      });
      setConfirmPassword('');
    } catch (error) {
      console.error('更新密码错误:', error);
      setError(handleApiError(error, '更新密码失败，请稍后重试'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-500 text-sm p-3 bg-green-50 rounded-md">
          {success}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">当前密码</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          value={formData.currentPassword}
          onChange={handleChange}
          placeholder="请输入当前密码"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">新密码</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="请输入新密码（至少8个字符）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">确认新密码</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={handleChange}
          placeholder="请再次输入新密码"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? '更新中...' : '更新密码'}
      </Button>
    </form>
  );
} 