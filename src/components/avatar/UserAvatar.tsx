"use client";

import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const DEFAULT_AVATAR_API_PATH = '/api/upload/file/avatars/default.webp';
const FALLBACK_TEXT = '粉';

const pastelGradients = [
  'from-[#fdf2f8] via-[#fce7f3] to-[#ede9fe]',
  'from-[#fef3c7] via-[#fde68a] to-[#fef9c3]',
  'from-[#e0f2fe] via-[#bfdbfe] to-[#fde68a]',
  'from-[#dcfce7] via-[#fef9c3] to-[#fecdd3]',
  'from-[#fae8ff] via-[#ede9fe] to-[#c7d2fe]',
  'from-[#fee2e2] via-[#ffe4e6] to-[#fef3c7]',
];

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
};

const isPlaceholderAvatar = (value?: string | null) => {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();

  if (trimmed === DEFAULT_AVATAR_API_PATH) return true;
  if (lower.endsWith('default-avatar.png')) return true;
  if (lower.endsWith('default_avatar.png')) return true;
  if (lower.endsWith('default.webp')) return true;
  if (lower.includes('placeholder-image')) return true;

  return false;
};

const normalizeAvatarUrl = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (isPlaceholderAvatar(trimmed)) {
    return undefined;
  }

  if (/^(https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/upload/file/')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (trimmed.startsWith('api/upload/file/')) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `/api/upload/file/${trimmed.replace(/^uploads\//, '')}`;
  }

  return `/api/upload/file/${trimmed.replace(/^\/+/, '')}`;
};

const getInitialChar = (name?: string | null) => {
  if (!name) return FALLBACK_TEXT;
  const trimmed = name.trim();
  if (!trimmed) return FALLBACK_TEXT;
  const first = trimmed[0];
  if (/^[a-z]/i.test(first)) {
    return first.toUpperCase();
  }
  return first;
};

const buildSeed = (value?: string | null) => {
  const base = value?.trim() || FALLBACK_TEXT;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash + base.charCodeAt(i)) % 2147483647;
  }
  return hash;
};

const pickGradient = (name?: string | null) => {
  const seed = buildSeed(name);
  return pastelGradients[seed % pastelGradients.length];
};

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
  fallbackClassName?: string;
  withBorder?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
  fallbackClassName,
  withBorder,
}) => {
  const normalizedSrc = useMemo(() => normalizeAvatarUrl(src), [src]);
  const initials = useMemo(() => getInitialChar(name), [name]);
  const gradientClass = useMemo(() => pickGradient(name), [name]);
  const [allowImage, setAllowImage] = useState(Boolean(normalizedSrc));

  useEffect(() => {
    setAllowImage(Boolean(normalizedSrc));
  }, [normalizedSrc]);

  return (
    <Avatar
      className={cn(
        sizeMap[size] ?? sizeMap.md,
        withBorder && 'border border-border/60 shadow-sm',
        className,
      )}
    >
      {normalizedSrc && allowImage && (
        <AvatarImage
          src={normalizedSrc}
          alt={name ? `${name} 的头像` : '用户头像'}
          onError={() => setAllowImage(false)}
        />
      )}
      <AvatarFallback
        className={cn(
          'uppercase font-semibold text-slate-700 bg-gradient-to-br',
          gradientClass,
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export const formatAvatarUrl = normalizeAvatarUrl;
