import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authService } from '@/services/auth.service';

// 后端API基础URL
const API_BASE_URL = 'http://localhost:3000';

// 扩展NextAuth的Session和JWT类型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      status?: string;
    }
    accessToken?: string;
  }

  interface User {
    id: string;
    username: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    accessToken?: string;
    role?: string;
    status?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    accessToken?: string;
    role?: string;
    status?: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
          // 使用 authService.login 进行登录
          const response = await authService.login({
            username: credentials.username,
            password: credentials.password,
          });

          // 适配后端返回的数据格式
          const user = response.user;
          const accessToken = response.access_token;

          // 返回包含访问令牌的用户信息
          return {
            id: user.uuid, // 使用 uuid 作为用户唯一标识
            name: user.nickname || user.username, // 优先使用昵称，否则使用用户名
            username: user.username,
            email: user.email,
            image: user.avatar_url, // 使用 avatar_url 作为 image
            role: user.role,
            status: user.status,
            accessToken, // 保存从后端获取的访问令牌
          };
        } catch (error) {
          console.error('登录错误:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.status = token.status;
        session.accessToken = token.accessToken;

        // 添加调试日志
        console.log('Session 回调中的 token:', token);
        console.log('Session 回调中的 session:', session);
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 