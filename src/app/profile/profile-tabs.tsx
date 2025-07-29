'use client';

import ProfileForm from './profile-form';
import PasswordForm from './password-form';
import FavoritesList from './favorites-list';
import DownloadsList from './downloads-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { AdminOnly } from '@/components/auth/PermissionGuard';
import dynamic from 'next/dynamic';

// 动态导入微博导入组件，避免不必要的代码加载
const WeiboImportTab = dynamic(() => import('./weibo-import-tab'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-md h-40" />,
});

// 动态导入上传记录组件
const UserUploadsPage = dynamic(() => import('./uploads/page'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-md h-40" />,
});

export default function ProfileTabs() {
  const { isAdmin } = useAuth();

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className={`grid w-full ${isAdmin() ? 'grid-cols-6' : 'grid-cols-5'}`}>
        <TabsTrigger value="profile">个人资料</TabsTrigger>
        <TabsTrigger value="password">修改密码</TabsTrigger>
        <TabsTrigger value="favorites">我的收藏</TabsTrigger>
        <TabsTrigger value="downloads">下载记录</TabsTrigger>
        <TabsTrigger value="uploads">上传记录</TabsTrigger>
        <AdminOnly showFallback={false}>
          <TabsTrigger value="weibo-import" className="text-orange-600 font-semibold">
            微博导入
          </TabsTrigger>
        </AdminOnly>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <ProfileForm />
      </TabsContent>

      <TabsContent value="password" className="mt-6">
        <PasswordForm />
      </TabsContent>

      <TabsContent value="favorites" className="mt-6">
        <FavoritesList />
      </TabsContent>

      <TabsContent value="downloads" className="mt-6">
        <DownloadsList />
      </TabsContent>

      <TabsContent value="uploads" className="mt-6">
        <UserUploadsPage />
      </TabsContent>

      <AdminOnly showFallback={false}>
        <TabsContent value="weibo-import" className="mt-6">
          <WeiboImportTab />
        </TabsContent>
      </AdminOnly>
    </Tabs>
  );
}

