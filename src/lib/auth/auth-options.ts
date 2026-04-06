import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authService } from '@/services/auth.service';

// 扩展NextAuth的Session和JWT类型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatar_url?: string | null;
      role?: string;
      status?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    authError?: string;
  }

  interface User {
    id: string;
    username: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatar_url?: string | null;
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    status?: string;
    accessTokenExpiresAt?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    status?: string;
    avatar_url?: string | null;
    accessTokenExpiresAt?: number;
    authError?: string;
  }
}

const decodeJwtExpiry = (token: string): number | undefined => {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return undefined;
    }
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = Buffer.from(normalizedPayload, 'base64').toString(
      'utf8',
    );
    const parsedPayload = JSON.parse(decodedPayload) as { exp?: number };
    if (typeof parsedPayload.exp !== 'number') {
      return undefined;
    }
    return parsedPayload.exp * 1000;
  } catch {
    return undefined;
  }
};

const shouldRefreshAccessToken = (expiresAt?: number): boolean => {
  if (!expiresAt) {
    return false;
  }
  const refreshBuffer = 60 * 1000;
  return Date.now() >= expiresAt - refreshBuffer;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const response = await authService.login({
            username: credentials.username,
            password: credentials.password,
          });

          const user = response.user;
          const accessToken = response.access_token;
          const refreshToken = response.refresh_token;
          const accessTokenExpiresAt = decodeJwtExpiry(accessToken);

          return {
            id: user.uuid,
            name: user.nickname || user.username,
            username: user.username,
            email: user.email,
            image: user.avatar_url,
            avatar_url: user.avatar_url,
            role: user.role,
            status: user.status,
            accessToken,
            refreshToken,
            accessTokenExpiresAt,
          };
        } catch (error) {
          console.error('登录错误:', error);

          if (error instanceof Error) {
            throw new Error(error.message || '登录失败，请稍后重试');
          }

          throw new Error('登录失败，请稍后重试');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.status = user.status;
        token.avatar_url = user.avatar_url ?? user.image ?? token.avatar_url ?? null;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.authError = undefined;
      }

      if (trigger === 'update' && session?.user) {
        token.avatar_url =
          session.user.avatar_url ??
          session.user.image ??
          token.avatar_url ??
          null;
      }

      if (
        token.refreshToken &&
        shouldRefreshAccessToken(token.accessTokenExpiresAt)
      ) {
        try {
          const refreshedToken = await authService.refreshToken(token.refreshToken);
          token.accessToken = refreshedToken.access_token;
          token.refreshToken = refreshedToken.refresh_token;
          token.accessTokenExpiresAt = decodeJwtExpiry(refreshedToken.access_token);
          token.authError = undefined;
        } catch (error) {
          console.error('刷新访问令牌失败:', error);
          token.accessToken = undefined;
          token.refreshToken = undefined;
          token.accessTokenExpiresAt = undefined;
          token.authError = 'REFRESH_ACCESS_TOKEN_ERROR';
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.avatar_url = token.avatar_url ?? session.user.image ?? null;
        session.user.image = token.avatar_url ?? session.user.image ?? null;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.accessTokenExpiresAt = token.accessTokenExpiresAt;
        session.authError = token.authError;

      }

      return session;
    },
  },
};
