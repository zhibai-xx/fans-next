import { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: '登录 | 张婧仪粉丝站',
  description: '登录您的张婧仪粉丝站账号',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center pb-16 pt-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-bold">登录</h1>
          <p className="text-gray-500 dark:text-gray-400">
            输入您的账号信息登录
          </p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            还没有账号？{' '}
          </span>
          <a href="/signup" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
            立即注册
          </a>
        </div>
      </div>
    </div>
  );
} 