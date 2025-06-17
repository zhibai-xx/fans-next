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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">个人中心</h1>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <ProfileTabs />
      </div>
    </div>
  );
} 