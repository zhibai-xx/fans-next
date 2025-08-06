'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Image,
  Tag,
  FolderOpen,
  FileCheck,
  Activity,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string | number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: '管理面板',
    icon: BarChart3,
    href: '/admin/dashboard',
  },
  {
    id: 'users',
    title: '用户管理',
    icon: Users,
    href: '/admin/users',
  },
  {
    id: 'media',
    title: '内容管理',
    icon: Image,
    href: '/admin/media',
  },
  {
    id: 'review',
    title: '审核管理',
    icon: FileCheck,
    href: '/admin/review',
  },
  {
    id: 'tags',
    title: '标签分类',
    icon: Tag,
    href: '/admin/tags',
  },
  {
    id: 'logs',
    title: '操作记录',
    icon: Activity,
    href: '/admin/logs',
  },
  {
    id: 'settings',
    title: '系统设置',
    icon: Settings,
    href: '/admin/settings',
  },
];

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ease-in-out flex-shrink-0",
      // 移动端固定定位，桌面端相对定位
      "lg:relative fixed lg:translate-x-0 z-30",
      // 响应式侧边栏宽度
      collapsed
        ? "w-16 -translate-x-full lg:translate-x-0"
        : "w-64 translate-x-0"
    )}>
      {/* 侧边栏头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-800">管理后台</h1>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className={cn(
                    "flex-shrink-0",
                    collapsed ? "w-5 h-5" : "w-5 h-5 mr-3",
                    isActive ? "text-blue-700" : "text-gray-500"
                  )} />

                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 侧边栏底部信息 */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <div className="flex items-center space-x-2 text-blue-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">系统正常运行</span>
            </div>
            <p className="text-blue-600 text-xs mt-1">
              管理员专用后台系统
            </p>
          </div>
        </div>
      )}
    </div>
  );
}