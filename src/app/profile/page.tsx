import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';
import ProfileTabs from './profile-tabs';

export const metadata: Metadata = {
  title: '个人资料 | 张婧仪粉丝站',
  description: '管理您的个人资料、收藏和下载内容',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">个人中心</h1>

        <div className="rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm p-6">
          <ProfileTabs />
        </div>
      </div>
    </div>
  );
} 
