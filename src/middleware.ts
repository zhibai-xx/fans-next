import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 需要登录才能访问的路径
const protectedPaths = [
  '/community',
  '/profile',
];

// 需要管理员权限的路径
const adminOnlyPaths = [
  '/weibo-import',
];

// 检查路径是否受保护
const isProtectedPath = (path: string) => {
  return protectedPaths.some((protectedPath) => path.startsWith(protectedPath));
};

// 检查路径是否需要管理员权限
const isAdminOnlyPath = (path: string) => {
  return adminOnlyPaths.some((adminPath) => path.startsWith(adminPath));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过静态资源和API路径
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // 获取会话token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 检查管理员专用路径
  if (isAdminOnlyPath(pathname)) {
    if (!token) {
      // 未登录用户跳转到登录页
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      url.searchParams.set('message', 'need-admin-permission');
      return NextResponse.redirect(url);
    }

    if ((token.user as any)?.role !== 'ADMIN') {
      // 非管理员用户跳转到主页并显示错误信息
      const url = new URL('/', request.url);
      url.searchParams.set('error', 'access-denied');
      return NextResponse.redirect(url);
    }
  }

  // 检查一般保护路径
  if (!token && isProtectedPath(pathname)) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 配置中间件需要匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有的路径除了:
     * - api 路由
     * - 静态资源文件 (_next/static 和 _next/image)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 