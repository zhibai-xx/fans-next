'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/hooks/mutations/useAuthMutations';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UserAvatar } from '@/components/avatar/UserAvatar';

export function AuthNavButtons() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const logoutMutation = useLogoutMutation();

  const handleSignOut = async () => {
    logoutMutation.mutate();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="w-full py-3 px-4 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          <span>加载中</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="relative">
        <Button
          onClick={toggleDropdown}
          variant="ghost"
          className="w-full py-3 px-4 border border-gray-200 text-gray-800 flex items-center justify-center space-x-2 rounded-xl hover:bg-gray-50 transition font-medium"
        >
          <UserAvatar
            src={user.avatar_url}
            name={user.nickname || user.username || '用户'}
            size="sm"
            className="mr-2 h-5 w-5"
          />
          <span className="text-sm truncate">
            {user.nickname || user.username || "用户"}
          </span>
        </Button>

        {isDropdownOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-3 p-3 bg-white border border-gray-100 rounded-xl shadow-xl z-10">
            <Link
              href="/profile"
              className="block py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setIsDropdownOpen(false)}
            >
              个人资料
            </Link>
            {/* 管理员专用入口 */}
            {isAdmin() && (
              <Link
                href="/admin/dashboard"
                className="block py-2 px-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                onClick={() => setIsDropdownOpen(false)}
              >
                管理后台
              </Link>
            )}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-left py-2.5 px-3 text-sm text-red-500 hover:bg-red-50 rounded-lg justify-start h-auto"
            >
              退出登录
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Link
        href="/login"
        className="w-full py-3 px-4 bg-black text-white rounded-xl text-center text-sm block font-medium hover:bg-gray-900 transition"
      >
        登录
      </Link>
      <Link
        href="/signup"
        className="w-full py-3 px-4 border border-gray-200 rounded-xl text-center text-sm block text-gray-800 hover:bg-gray-50 transition font-medium"
      >
        注册
      </Link>
    </div>
  );
}
