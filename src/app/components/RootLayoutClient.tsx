'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { IconRenderer } from '@/components/icons/IconRenderer';
import { AuthNavButtons } from '@/components/auth-nav-buttons';
import { colorThemes } from '@/theme/color-themes';
import { applyColorTheme } from '@/theme/apply-color-theme';
import { useEffect } from 'react';
import { isSupportModuleEnabled, isVideoFeatureEnabled } from '@/lib/features';

interface RootLayoutClientProps {
  children: React.ReactNode;
}

const PRIMARY_LINKS = [
  { href: '/', icon: '/icons/fire.svg', label: '首页' },
  { href: '/images', icon: '/icons/images.svg', label: '图片' },
  { href: '/profile', icon: '/icons/profile.svg', label: '个人' },
];

const NAV_LINKS = isVideoFeatureEnabled
  ? [
      ...PRIMARY_LINKS.slice(0, 2),
      { href: '/videos', icon: '/icons/video.svg', label: '视频' },
      ...PRIMARY_LINKS.slice(2),
    ]
  : PRIMARY_LINKS;

const SECONDARY_LINKS = isSupportModuleEnabled
  ? [{ href: '/shop', icon: '/icons/support.svg', label: '支持我们' }]
  : [];

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();
  // 主题切换短期关闭，固定默认主题，后续如需恢复可重新接入 UI store
  const activeTheme = colorThemes['clay-a'];

  // 检查是否是管理后台路径
  const isAdminPath = pathname.startsWith('/admin');

  useEffect(() => {
    applyColorTheme(activeTheme);
    document.documentElement.dataset.colorTheme = activeTheme.id;
  }, [activeTheme]);

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
    <div
      className="flex min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: 'var(--theme-background)',
        color: 'var(--theme-text)',
      }}
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-28 right-[-140px] h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--theme-accent-soft)' }}
        />
        <div
          className="absolute top-[20%] left-[140px] h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--theme-cool-soft)' }}
        />
      </div>
      {/* 左侧导航栏 */}
      <nav
        className="w-[230px] border p-5 flex flex-col fixed h-full z-50 left-0 top-0 rounded-2xl m-3"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
          boxShadow: '0 12px 30px -26px rgba(0,0,0,0.25)',
        }}
      >
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div
            className="h-10 w-10 rounded-2xl border flex items-center justify-center text-sm font-semibold tracking-wider"
            style={{
              backgroundColor: 'var(--theme-accent-soft)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            JOY
          </div>
          <div>
            <p className="text-sm font-semibold">JOY 图片站</p>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>JOY Image Archive</p>
          </div>
        </Link>

        <div className="space-y-1 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--theme-text-muted)' }}>
            导航
          </p>
          {NAV_LINKS.map((link) => (
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

          {SECONDARY_LINKS.length > 0 ? (
            <div className="pt-4">
              <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--theme-text-muted)' }}>
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
          ) : null}
        </div>

        <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          <AuthNavButtons />
        </div>
      </nav>

      {/* 右侧内容区 - 添加最小宽度和边界保护 */}
      <main className="flex-1 ml-[245px] min-w-0 relative z-10">
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
        'group flex items-center gap-3 py-2 px-2.5 rounded-xl text-[13px] font-medium transition-colors',
        isActive
          ? ''
          : '',
      ].join(' ')}
      style={
        isActive
          ? {
              backgroundColor: 'var(--theme-accent-soft)',
              color: 'var(--theme-text)',
            }
          : {
              color: 'var(--theme-text-muted)',
              backgroundColor: 'transparent',
            }
      }
    >
      <div
        className={[
          'w-8 h-8 flex items-center justify-center rounded-lg border text-xs',
        ].join(' ')}
        style={
          isActive
            ? {
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
                backgroundColor: 'rgba(255,255,255,0.75)',
              }
            : {
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-muted)',
                backgroundColor: 'rgba(255,255,255,0.5)',
              }
        }
      >
        <IconRenderer iconName={icon} />
      </div>
      <span className="text-[13px] font-medium">{label}</span>
    </Link>
  );
}
