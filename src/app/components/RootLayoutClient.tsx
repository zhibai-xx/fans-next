'use client';

import { usePathname } from 'next/navigation';
import Link from "next/link";
import { IconRenderer } from "@/components/icons/IconRenderer";
import { AuthNavButtons } from "@/components/auth-nav-buttons";

interface RootLayoutClientProps {
  children: React.ReactNode;
}

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
    <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-x-hidden">
      {/* 左侧导航栏 - 增加高 z-index 和触摸保护 */}
      <nav className="w-[164px] bg-black text-white p-4 flex flex-col fixed h-full z-50 left-0 top-0">
        <div className="my-[53px]">
          <Link href="/" className="flex items-center justify-center">
            <span className="text-xl font-bold">ZJY</span>
          </Link>
        </div>

        <div className="space-y-3">
          <NavItem href="/" icon="/icons/fire.svg" label="动态" />
          <NavItem href="/images" icon="/icons/images.svg" label="图片" />
          <NavItem href="/videos" icon="/icons/video.svg" label="视频" />
          <NavItem href="/community" icon="/icons/community.svg" label="社区" />
          <NavItem href="/profile" icon="/icons/profile.svg" label="个人" />
        </div>
        <div className="mt-[50px]">
          <NavItem href="/shop" icon="/icons/shop.svg" label="商店" />
        </div>

        <AuthNavButtons />
      </nav>

      {/* 右侧内容区 - 添加最小宽度和边界保护 */}
      <main className="flex-1 ml-[166px] p-8 min-w-0 relative">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="flex  items-center text-center py-2 hover:text-gray-300 transition">
      <div className="w-8 h-8 mr-2 flex items-center justify-center">
        <IconRenderer iconName={icon} />
      </div>
      <span className="text-[13px]">{label}</span>
    </Link>
  );
}