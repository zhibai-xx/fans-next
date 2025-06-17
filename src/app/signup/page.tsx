import { Metadata } from 'next';
import SignupForm from './signup-form';

export const metadata: Metadata = {
  title: '注册 | 张婧仪粉丝站',
  description: '创建您的张婧仪粉丝站账号',
};

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center pb-16 pt-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-bold">注册账号</h1>
          <p className="text-gray-500 dark:text-gray-400">
            创建您的粉丝站账号，获取更多功能
          </p>
        </div>
        
        <SignupForm />
        
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            已有账号？{' '}
          </span>
          <a href="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
            立即登录
          </a>
        </div>
      </div>
    </div>
  );
} 