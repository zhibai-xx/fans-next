'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { IconRenderer } from '@/components/icons/IconRenderer';
import { AuthNavButtons } from '@/components/auth-nav-buttons';

interface RootLayoutClientProps {
  children: React.ReactNode;
}

const PRIMARY_LINKS = [
  { href: '/', icon: '/icons/fire.svg', label: '动态' },
  { href: '/images', icon: '/icons/images.svg', label: '图片' },
  { href: '/videos', icon: '/icons/video.svg', label: '视频' },
  { href: '/community', icon: '/icons/community.svg', label: '社区' },
  { href: '/profile', icon: '/icons/profile.svg', label: '个人' },
];

const SECONDARY_LINKS = [
  { href: '/shop', icon: '/icons/shop.svg', label: '商店' },
];

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();

  // 检查是否是管理后台路径
  const isAdminPath = pathname.startsWith('/admin');

  if (isAdminPath) {
    // 管理后台使用完整屏幕，不显示主网站导航
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // 主网站使用原有布局
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-black dark:text-white overflow-x-hidden">
      {/* 左侧导航栏 */}
      <nav className="w-[230px] bg-white border-r border-gray-100 shadow-sm p-6 flex flex-col fixed h-full z-50 left-0 top-0">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center text-sm font-semibold tracking-wider">
            JOY
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">JOY 粉丝社区</p>
            <p className="text-xs text-gray-500">JOY Fans Hub</p>
          </div>
        </Link>

        <div className="space-y-1 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-2">
            导航
          </p>
          {PRIMARY_LINKS.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              isActive={
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href))
              }
            />
          ))}

          <div className="pt-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-2">
              特色
            </p>
            {SECONDARY_LINKS.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={pathname.startsWith(link.href)}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <AuthNavButtons />
        </div>
      </nav>

      {/* 右侧内容区 - 添加最小宽度和边界保护 */}
      <main className="flex-1 ml-[245px] min-w-0 relative">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        'group flex items-center py-2 px-3 rounded-xl text-sm transition-colors',
        isActive
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
      ].join(' ')}
    >
      <div
        className={[
          'w-8 h-8 mr-3 flex items-center justify-center rounded-lg border text-xs',
          isActive ? 'border-gray-300 text-gray-900' : 'border-gray-200',
        ].join(' ')}
      >
        <IconRenderer iconName={icon} />
      </div>
      <span className="text-[13px] font-medium">{label}</span>
    </Link>
  );
}
