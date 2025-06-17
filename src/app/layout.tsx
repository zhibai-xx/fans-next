import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { IconRenderer } from "@/components/icons/IconRenderer";
import Head from 'next/head';
import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthNavButtons } from "@/components/auth-nav-buttons";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "张婧仪粉丝站 | 最新动态",
  description: "汇聚偶像图片、视频和粉丝互动社区",
  openGraph: {
    images: ["/og-images/zjy.jpeg"], // 社交媒体预览图
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <Head>
        <link
          rel="preload"
          href="/styles/globals.css"
          as="style"
        />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* 左侧导航栏 */}
            <nav className="w-[164px] bg-black text-white p-4 flex flex-col fixed h-full">
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

            {/* 右侧内容区 */}
            <main className="flex-1 ml-[166px] p-8">
              {children}
            </main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
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
