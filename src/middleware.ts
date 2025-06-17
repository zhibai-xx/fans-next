import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 需要登录才能访问的路径
const protectedPaths = [
  '/community',
  '/profile',
];

// 检查路径是否受保护
const isProtectedPath = (path: string) => {
  return protectedPaths.some((protectedPath) => path.startsWith(protectedPath));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳过静态资源和非保护路径
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/' ||
    !isProtectedPath(pathname)
  ) {
    return NextResponse.next();
  }

  // 获取会话token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 如果未登录且路径需要保护，跳转到登录页
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