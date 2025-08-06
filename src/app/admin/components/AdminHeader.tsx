'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  Home,
  Shield
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function AdminHeader({ onToggleSidebar, sidebarCollapsed }: AdminHeaderProps) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* 左侧 - 菜单按钮和面包屑 */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="flex"
            aria-label="切换侧边栏"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>管理员后台</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-medium">仪表板</span>
          </div>
        </div>

        {/* 右侧 - 通知和用户菜单 */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* 快速返回首页按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToHome}
            className="hidden sm:flex items-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden md:inline">返回首页</span>
          </Button>

          {/* 通知按钮 */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {/* 通知徽章 */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
          </div>

          {/* 用户下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.nickname || user?.username || '管理员'}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs">
                      {isAdmin() ? '管理员' : '用户'}
                    </Badge>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.nickname || user?.username || '管理员'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleBackToHome}>
                <Home className="mr-2 h-4 w-4" />
                <span>返回首页</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>个人资料</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>系统设置</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}