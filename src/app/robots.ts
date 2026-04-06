import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/images', '/shop'],
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/signup',
          '/profile/',
          '/system-ingest/',
          '/performance-dashboard/',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
