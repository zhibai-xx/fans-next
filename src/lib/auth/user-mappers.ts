import type { User as StoreUser } from '@/store/auth.store';
import type { UserProfile } from '@/services/user.service';

type RawSessionUser = Record<string, unknown>;

export type AuthViewUser = {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  nickname?: string;
  avatar_url?: string;
};

const parseUserId = (rawId: unknown): number => {
  if (typeof rawId === 'number') {
    return rawId;
  }

  if (typeof rawId === 'string') {
    const parsedId = Number(rawId);
    return Number.isNaN(parsedId) ? 0 : parsedId;
  }

  return 0;
};

export const mapSessionUserToStoreUser = (sessionUser: RawSessionUser): StoreUser => {
  const createdAt =
    typeof sessionUser.created_at === 'string'
      ? sessionUser.created_at
      : new Date().toISOString();

  const updatedAt =
    typeof sessionUser.updated_at === 'string'
      ? sessionUser.updated_at
      : new Date().toISOString();

  return {
    id: parseUserId(sessionUser.id),
    uuid: typeof sessionUser.uuid === 'string' ? sessionUser.uuid : '',
    username: typeof sessionUser.username === 'string' ? sessionUser.username : '',
    email: typeof sessionUser.email === 'string' ? sessionUser.email : '',
    role: sessionUser.role === 'ADMIN' ? 'ADMIN' : 'USER',
    status: sessionUser.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    avatar_url:
      typeof sessionUser.avatar_url === 'string'
        ? sessionUser.avatar_url
        : typeof sessionUser.image === 'string'
        ? sessionUser.image
        : undefined,
    nickname:
      typeof sessionUser.nickname === 'string' ? sessionUser.nickname : undefined,
    phoneNumber:
      typeof sessionUser.phoneNumber === 'string'
        ? sessionUser.phoneNumber
        : undefined,
    created_at: createdAt,
    updated_at: updatedAt,
  };
};

export const mergeProfileIntoStoreUser = (
  currentUser: StoreUser | null,
  profile: UserProfile,
): StoreUser => {
  if (!currentUser) {
    return {
      id: profile.id,
      uuid: profile.uuid,
      username: profile.username,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      avatar_url: profile.avatar_url,
      nickname: profile.nickname,
      phoneNumber: profile.phoneNumber,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  return {
    ...currentUser,
    id: profile.id,
    uuid: profile.uuid,
    username: profile.username,
    email: profile.email || currentUser.email,
    role: profile.role,
    status: profile.status,
    nickname: profile.nickname || currentUser.nickname,
    phoneNumber: profile.phoneNumber || currentUser.phoneNumber,
    avatar_url: profile.avatar_url || currentUser.avatar_url,
    created_at: profile.created_at || currentUser.created_at,
    updated_at: profile.updated_at || currentUser.updated_at,
  };
};

export const mapStoreUserToAuthViewUser = (
  user: StoreUser | null,
): AuthViewUser | null => {
  if (!user) {
    return null;
  }

  return {
    id: user.uuid || user.id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    nickname: user.nickname,
    avatar_url: user.avatar_url,
  };
};
