import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Head from 'next/head';
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { RootLayoutClient } from "./components/RootLayoutClient";

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
        <QueryProvider>
          <AuthProvider>
            <RootLayoutClient>{children}</RootLayoutClient>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}


