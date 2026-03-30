import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  AdminUsersService,
  type PaginatedResponse,
  type User,
  type UserFilters,
  type UserStats,
} from '@/services/admin-users.service';
import { queryKeys } from '@/lib/query-client';

const USER_LIST_STALE_TIME = 2 * 60 * 1000;
const USER_DETAIL_STALE_TIME = 5 * 60 * 1000;
const USER_STATS_STALE_TIME = 5 * 60 * 1000;
const USER_SEARCH_STALE_TIME = 30 * 1000;

const ensureSuccess = <T extends { success: boolean; message?: string }>(response: T, fallbackMessage: string): T => {
  if (!response.success) {
    throw new Error(response.message || fallbackMessage);
  }

  return response;
};

export const userQueryOptions = {
  list: (filters: UserFilters = {}, page: number = 1, limit: number = 24) =>
    queryOptions({
      queryKey: queryKeys.users.list({ ...filters, page, limit }),
      queryFn: async () =>
        ensureSuccess(
          await AdminUsersService.getUsers(filters, page, limit),
          '获取用户列表失败',
        ),
      staleTime: USER_LIST_STALE_TIME,
      gcTime: 10 * 60 * 1000,
      placeholderData: (previousData: PaginatedResponse<User> | undefined) => previousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.users.detail(id),
      queryFn: async () => {
        const response = ensureSuccess(
          await AdminUsersService.getUserById(Number(id)),
          '获取用户详情失败',
        );

        if (!response.data) {
          throw new Error('获取用户详情失败');
        }

        return response.data;
      },
      staleTime: USER_DETAIL_STALE_TIME,
      gcTime: 15 * 60 * 1000,
    }),
  stats: () =>
    queryOptions({
      queryKey: queryKeys.users.stats(),
      queryFn: async () => {
        const response = ensureSuccess(
          await AdminUsersService.getUserStats(),
          '获取用户统计失败',
        );

        if (!response.data) {
          throw new Error('获取用户统计失败');
        }

        return response.data;
      },
      staleTime: USER_STATS_STALE_TIME,
      gcTime: 30 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    }),
  infiniteList: (filters: UserFilters = {}, limit: number = 24) =>
    infiniteQueryOptions({
      queryKey: queryKeys.users.list({ ...filters, infinite: true, limit }),
      queryFn: async ({ pageParam = 1 }) =>
        ensureSuccess(
          await AdminUsersService.getUsers(filters, Number(pageParam), limit),
          '获取用户列表失败',
        ),
      getNextPageParam: (lastPage: PaginatedResponse<User>) => {
        if (!lastPage.pagination) {
          return undefined;
        }

        const { page, totalPages } = lastPage.pagination;
        return page < totalPages ? page + 1 : undefined;
      },
      initialPageParam: 1,
      staleTime: USER_LIST_STALE_TIME,
      gcTime: 10 * 60 * 1000,
    }),
  search: (searchTerm: string) =>
    queryOptions({
      queryKey: queryKeys.users.list({ search: searchTerm, limit: 20 }),
      queryFn: async () => {
        if (!searchTerm.trim()) {
          return {
            success: true,
            data: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
            },
          } satisfies PaginatedResponse<User>;
        }

        return ensureSuccess(
          await AdminUsersService.getUsers({ search: searchTerm }, 1, 20),
          '搜索用户失败',
        );
      },
      staleTime: USER_SEARCH_STALE_TIME,
      gcTime: 2 * 60 * 1000,
    }),
};

export type UserListQueryData = PaginatedResponse<User>;
export type UserDetailQueryData = User;
export type UserStatsQueryData = UserStats;
