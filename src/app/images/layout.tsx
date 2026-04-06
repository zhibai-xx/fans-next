import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '张婧仪图片整理',
  description:
    '浏览张婧仪公开活动、品牌拍摄、剧照与高清图片内容，按图集、标签与分类持续整理更新。',
  alternates: {
    canonical: '/images',
  },
};

export default function ImagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
