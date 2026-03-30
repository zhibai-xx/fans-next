// next.config.ts
import type { NextConfig } from "next";

const backendOrigin =
  process.env.BACKEND_INTERNAL_ORIGIN || 'http://127.0.0.1:3000';

const buildBackendDestination = (path: string) => `${backendOrigin}${path}`;

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true, // 允许 SVG 优化
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**', // 允许所有外部图片源
      },
    ],
  },
  // API重写规则 - 只代理特定的后端API路径，保留Next.js内置API
  async rewrites() {
    return [
      // 忽略Chrome DevTools请求，避免404错误
      {
        source: '/.well-known/appspecific/:path*',
        destination: '/api/devtools-ignore',
      },
      // 代理后端业务API路径
      {
        source: '/api/upload/:path*',
        destination: buildBackendDestination('/api/upload/:path*'),
      },
      {
        source: '/api/admin/:path*',
        destination: buildBackendDestination('/api/admin/:path*'),
      },
      {
        source: '/api/media/:path*',
        destination: buildBackendDestination('/api/media/:path*'),
      },
      {
        source: '/api/users/:path*',
        destination: buildBackendDestination('/api/users/:path*'),
      },
      {
        source: '/api/tags/:path*',
        destination: buildBackendDestination('/api/tags/:path*'),
      },
      {
        source: '/api/categories/:path*',
        destination: buildBackendDestination('/api/categories/:path*'),
      },
      // 代理静态文件
      {
        source: '/processed/:path*',
        destination: buildBackendDestination('/processed/:path*'),
      },
    ];
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
      },
    },
  },
};

export default nextConfig;
