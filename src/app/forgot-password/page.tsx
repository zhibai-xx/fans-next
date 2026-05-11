import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '找回密码 | JOY 图片站',
  description: '找回 JOY 图片站账号密码',
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-gray-900">找回密码</h1>
          <p className="text-sm leading-6 text-gray-600">
            当前站点暂未开放自助重置密码功能。如果你忘记了密码，请联系站点管理员协助处理。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            返回登录
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
