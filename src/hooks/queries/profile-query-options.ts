import { queryOptions } from '@tanstack/react-query';
import { userService, type UserProfile } from '@/services/user.service';

export const profileQueryKeys = {
  profile: ['profile'] as const,
  downloads: ['profile', 'downloads'] as const,
  favorites: ['profile', 'favorites'] as const,
  uploads: ['profile', 'uploads'] as const,
  systemIngest: ['profile', 'system-ingest'] as const,
};

const ensureAuthenticated = (isEnabled: boolean): void => {
  if (!isEnabled) {
    throw new Error('用户未登录');
  }
};

export const profileQueryOptions = {
  profile: (isEnabled: boolean) =>
    queryOptions({
      queryKey: profileQueryKeys.profile,
      queryFn: async (): Promise<UserProfile> => {
        ensureAuthenticated(isEnabled);
        return userService.getProfile();
      },
      staleTime: 5 * 60 * 1000,
      retry: (failureCount: number, error: Error) => {
        if (error.message.includes('未登录') || error.message.includes('过期')) {
          return false;
        }
        return failureCount < 3;
      },
    }),
  downloads: (isEnabled: boolean) =>
    queryOptions({
      queryKey: profileQueryKeys.downloads,
      queryFn: async () => {
        ensureAuthenticated(isEnabled);
        return userService.getDownloads();
      },
      staleTime: 2 * 60 * 1000,
    }),
  favorites: (isEnabled: boolean) =>
    queryOptions({
      queryKey: profileQueryKeys.favorites,
      queryFn: async () => {
        ensureAuthenticated(isEnabled);
        return [];
      },
      staleTime: 2 * 60 * 1000,
    }),
  uploads: (isEnabled: boolean, page: number = 1, limit: number = 20) =>
    queryOptions({
      queryKey: [...profileQueryKeys.uploads, page, limit] as const,
      queryFn: async () => {
        ensureAuthenticated(isEnabled);
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      },
      staleTime: 2 * 60 * 1000,
      placeholderData: (previousData: {
        data: never[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      } | undefined) => previousData,
    }),
};
