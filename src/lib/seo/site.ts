export const siteConfig = {
  name: 'Enjoy Corner',
  title: 'Enjoy Corner | 张婧仪图片整理与内容归档',
  description:
    '整理张婧仪公开活动、品牌拍摄、剧照与高清图片内容，持续更新图集、整理记录与精选归档。',
  keywords: [
    '张婧仪',
    '张婧仪图片',
    '张婧仪高清图片',
    '张婧仪图集',
    '张婧仪粉丝站',
    '张婧仪粉丝图片',
    'Enjoy Corner',
  ],
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
};

export const publicRouteConfigs = [
  {
    path: '/',
    changeFrequency: 'daily' as const,
    priority: 1,
  },
  {
    path: '/images',
    changeFrequency: 'daily' as const,
    priority: 0.9,
  },
  {
    path: '/shop',
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  },
];
