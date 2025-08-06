'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Search,
  Filter,
  Edit,
  Shield,
  UserX,
  UserCheck,
  MoreHorizontal,
  Calendar,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminUsersService, User, UserFilters } from '@/services/admin-users.service';
import { useUserManagement, useUserStatusOptions, useUserRoleOptions } from '@/hooks/queries/useUsers';
import { queryUtils } from '@/lib/query-client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Label } from '@/components/ui/label';

// 本地筛选状态类型
interface LocalFilters {
  role: 'ALL' | 'USER' | 'ADMIN';
  status: 'ALL' | 'ACTIVE' | 'SUSPENDED';
  sortBy: 'created_at' | 'username' | 'email';
  sortOrder: 'asc' | 'desc';
}

// 分页状态类型
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 编辑表单类型
interface EditForm {
  username: string;
  email: string;
  nickname: string;
  phoneNumber: string;
}

export default function UsersManagementPage() {
  const { toast } = useToast();

  // 筛选和分页状态（本地UI状态）
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<LocalFilters>({
    role: 'ALL',
    status: 'ALL',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // 构建API筛选参数
  const apiFilters: UserFilters = {
    search: searchTerm.trim() || undefined,
    role: filters.role === 'ALL' ? undefined : filters.role,
    status: filters.status === 'ALL' ? undefined : filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  };

  // 使用TanStack Query获取用户数据
  const {
    users,
    pagination: queryPagination,
    stats,
    isLoading,
    error,
    hasError,
    refetchUsers
  } = useUserManagement(apiFilters, pagination.page, pagination.limit);

  // 同步查询结果到本地分页状态
  React.useEffect(() => {
    if (queryPagination) {
      setPagination(prev => ({
        ...prev,
        total: queryPagination.total,
        totalPages: queryPagination.totalPages
      }));
    }
  }, [queryPagination]);

  // 对话框状态
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'promote' | 'demote'>('suspend');

  // 编辑表单状态
  const [editForm, setEditForm] = useState<EditForm>({
    username: '',
    email: '',
    nickname: '',
    phoneNumber: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // 获取选项数据
  const statusOptions = useUserStatusOptions();
  const roleOptions = useUserRoleOptions();

  // 处理错误
  React.useEffect(() => {
    if (hasError && error) {
      console.error('加载用户列表失败:', error);
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '无法加载用户列表，请检查网络连接',
        variant: 'destructive'
      });
    }
  }, [hasError, error, toast]);

  // 重置到第一页的辅助函数
  const resetToFirstPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // 筛选条件变化时重置到第一页
  React.useEffect(() => {
    resetToFirstPage();
  }, [filters.role, filters.status, filters.sortBy, filters.sortOrder, resetToFirstPage]);

  // 搜索防抖处理
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 搜索防抖触发:', searchTerm);
      resetToFirstPage();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, resetToFirstPage]);

  /**
   * 用户操作处理函数
   */
  const handleUserAction = async (user: User, action: typeof actionType) => {
    try {
      console.log('📊 执行用户操作:', { userId: user.id, action });

      let response;
      let actionName = '';

      switch (action) {
        case 'suspend':
          response = await AdminUsersService.updateUserStatus(user.id, 'SUSPENDED');
          actionName = '暂停';
          break;
        case 'activate':
          response = await AdminUsersService.updateUserStatus(user.id, 'ACTIVE');
          actionName = '激活';
          break;
        case 'promote':
          response = await AdminUsersService.updateUserRole(user.id, 'ADMIN');
          actionName = '提升为管理员';
          break;
        case 'demote':
          response = await AdminUsersService.updateUserRole(user.id, 'USER');
          actionName = '降级为用户';
          break;
        default:
          throw new Error('未知操作类型');
      }

      if (response.success) {
        toast({
          title: '操作成功',
          description: `用户 ${user.username} 已${actionName}`,
        });
        // 刷新用户查询缓存
        queryUtils.invalidateUsers();
        refetchUsers();
      } else {
        toast({
          title: '操作失败',
          description: response.message || '操作失败，请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('用户操作失败:', error);
      toast({
        title: '操作失败',
        description: error.message || '操作失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setConfirmDialogOpen(false);
      setSelectedUser(null);
    }
  };

  /**
   * 打开确认对话框
   */
  const openConfirmDialog = (user: User, action: typeof actionType) => {
    setSelectedUser(user);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  /**
   * 打开编辑对话框
   */
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      nickname: user.nickname || '',
      phoneNumber: user.phoneNumber || ''
    });
    setEditDialogOpen(true);
  };

  /**
   * 处理编辑用户信息
   */
  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      setEditLoading(true);

      // 检查是否有变化
      const updateData: any = {};
      if (editForm.username !== selectedUser.username) updateData.username = editForm.username;
      if (editForm.email !== selectedUser.email) updateData.email = editForm.email;
      if (editForm.nickname !== (selectedUser.nickname || '')) updateData.nickname = editForm.nickname;
      if (editForm.phoneNumber !== (selectedUser.phoneNumber || '')) updateData.phoneNumber = editForm.phoneNumber;

      if (Object.keys(updateData).length === 0) {
        setEditDialogOpen(false);
        toast({
          title: '提示',
          description: '没有检测到任何变化',
        });
        return;
      }

      console.log('📊 更新用户信息:', { userId: selectedUser.id, updateData });

      const response = await AdminUsersService.updateUser(selectedUser.id, updateData);

      if (response.success) {
        toast({
          title: '更新成功',
          description: `用户 ${selectedUser.username} 的信息已更新`,
        });
        // 刷新用户查询缓存
        queryUtils.invalidateUsers();
        refetchUsers();
        setEditDialogOpen(false);
      } else {
        toast({
          title: '更新失败',
          description: response.message || '请稍后重试',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('更新用户信息失败:', error);
      toast({
        title: '更新失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setEditLoading(false);
    }
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  /**
   * 获取用户状态徽章样式
   */
  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">活跃</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive">暂停</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  /**
   * 获取用户角色徽章样式
   */
  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">管理员</Badge>;
      case 'USER':
        return <Badge variant="outline">普通用户</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-2">
        <Users className="w-6 h-6" />
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Badge variant="secondary">共 {pagination.total} 个用户</Badge>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索用户名、邮箱或昵称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 角色筛选 */}
            <Select
              value={filters.role}
              onValueChange={(value: LocalFilters['role']) =>
                setFilters(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部角色</SelectItem>
                <SelectItem value="ADMIN">管理员</SelectItem>
                <SelectItem value="USER">普通用户</SelectItem>
              </SelectContent>
            </Select>

            {/* 状态筛选 */}
            <Select
              value={filters.status}
              onValueChange={(value: LocalFilters['status']) =>
                setFilters(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="ACTIVE">活跃</SelectItem>
                <SelectItem value="SUSPENDED">暂停</SelectItem>
              </SelectContent>
            </Select>

            {/* 排序 */}
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-') as [LocalFilters['sortBy'], LocalFilters['sortOrder']];
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">创建时间 ↓</SelectItem>
                <SelectItem value="created_at-asc">创建时间 ↑</SelectItem>
                <SelectItem value="username-asc">用户名 A-Z</SelectItem>
                <SelectItem value="username-desc">用户名 Z-A</SelectItem>
                <SelectItem value="email-asc">邮箱 A-Z</SelectItem>
                <SelectItem value="email-desc">邮箱 Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>用户列表</span>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              <span>第 {pagination.page} 页，共 {pagination.totalPages} 页</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner className="justify-center" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? '未找到匹配的用户' : '暂无用户数据'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 用户表格 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">用户信息</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">角色</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">创建时间</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="font-medium">{user.username}</div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </div>
                            {user.nickname && (
                              <div className="text-sm text-gray-600">昵称: {user.nickname}</div>
                            )}
                            {user.phoneNumber && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getUserRoleBadge(user.role)}
                        </td>
                        <td className="py-4 px-4">
                          {getUserStatusBadge(user.status)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(user.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>操作</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑信息
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              {user.status === 'ACTIVE' ? (
                                <DropdownMenuItem
                                  onClick={() => openConfirmDialog(user, 'suspend')}
                                  className="text-red-600"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  暂停用户
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => openConfirmDialog(user, 'activate')}
                                  className="text-green-600"
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  激活用户
                                </DropdownMenuItem>
                              )}

                              {user.role === 'USER' ? (
                                <DropdownMenuItem
                                  onClick={() => openConfirmDialog(user, 'promote')}
                                  className="text-blue-600"
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  提升为管理员
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => openConfirmDialog(user, 'demote')}
                                  className="text-orange-600"
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  降级为用户
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页控件 */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>
                      显示 {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                      共 {pagination.total} 条记录
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      上一页
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      下一页
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑用户信息对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑用户信息</DialogTitle>
            <DialogDescription>
              修改用户 <strong>{selectedUser?.username}</strong> 的基本信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="请输入用户名"
              />
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="请输入邮箱地址"
              />
            </div>

            {/* 昵称 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                value={editForm.nickname}
                onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="请输入昵称（可选）"
              />
            </div>

            {/* 手机号 */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">手机号</Label>
              <Input
                id="phoneNumber"
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="请输入手机号（可选）"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditUser} disabled={editLoading}>
              {editLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认操作对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  您确定要对用户 <strong>{selectedUser.username}</strong> 执行
                  <strong className="text-red-600 mx-1">
                    {actionType === 'suspend' && '暂停'}
                    {actionType === 'activate' && '激活'}
                    {actionType === 'promote' && '提升为管理员'}
                    {actionType === 'demote' && '降级为用户'}
                  </strong>
                  操作吗？
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant={actionType === 'suspend' ? 'destructive' : 'default'}
              onClick={() => selectedUser && handleUserAction(selectedUser, actionType)}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}