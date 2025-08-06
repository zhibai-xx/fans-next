'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/hooks/mutations/useAuthMutations';
import LoadingSpinner from '@/components/LoadingSpinner';

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
      <div className="mt-auto mb-4 text-center">
        <div className="w-full py-2 px-4 bg-gray-800 text-white opacity-50 rounded-full text-center text-sm flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="mt-auto mb-4 relative">
        <Button
          onClick={toggleDropdown}
          variant="secondary"
          className="w-full py-2 px-4 bg-gray-800 flex items-center justify-center space-x-2 rounded-full hover:bg-gray-700 transition text-white"
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.nickname || user.username || "用户头像"}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 bg-white text-gray-800 rounded-full flex items-center justify-center text-xs font-bold">
              {user.nickname?.charAt(0) ||
                user.username?.charAt(0) ||
                "U"}
            </div>
          )}
          <span className="text-sm truncate">
            {user.nickname || user.username || "用户"}
          </span>
        </Button>

        {isDropdownOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-gray-900 rounded-md shadow-lg z-10">
            <Link
              href="/profile"
              className="block py-2 px-3 text-sm hover:bg-gray-800 rounded"
              onClick={() => setIsDropdownOpen(false)}
            >
              个人资料
            </Link>
            {/* 管理员专用入口 */}
            {isAdmin() && (
              <Link
                href="/admin/dashboard"
                className="block py-2 px-3 text-sm text-blue-400 hover:bg-gray-800 rounded"
                onClick={() => setIsDropdownOpen(false)}
              >
                管理后台
              </Link>
            )}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-left py-2 px-3 text-sm text-red-400 hover:bg-gray-800 rounded justify-start h-auto"
            >
              退出登录
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-auto mb-4">
      <Link href="/login" className="w-full py-2 px-4 bg-white text-black rounded-full text-center text-sm block hover:bg-gray-200 transition">
        登录
      </Link>
      <Link href="/signup" className="w-full py-2 px-4 border border-white rounded-full text-center text-sm block mt-2 hover:bg-gray-900 transition">
        注册
      </Link>
    </div>
  );
} 