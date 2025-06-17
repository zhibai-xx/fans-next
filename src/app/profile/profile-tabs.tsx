'use client';

import ProfileForm from './profile-form';
import PasswordForm from './password-form';
import FavoritesList from './favorites-list';
import DownloadsList from './downloads-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfileTabs() {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">个人资料</TabsTrigger>
        <TabsTrigger value="password">修改密码</TabsTrigger>
        <TabsTrigger value="favorites">我的收藏</TabsTrigger>
        <TabsTrigger value="downloads">下载记录</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="py-4">
        <ProfileForm />
      </TabsContent>

      <TabsContent value="password" className="py-4">
        <PasswordForm />
      </TabsContent>

      <TabsContent value="favorites" className="py-4">
        <FavoritesList />
      </TabsContent>

      <TabsContent value="downloads" className="py-4">
        <DownloadsList />
      </TabsContent>
    </Tabs>
  );
}

