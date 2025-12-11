"use client";

import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User2 } from 'lucide-react';

const DEFAULT_AVATAR_API_PATH = '/api/upload/file/avatars/default.webp';
const FALLBACK_TEXT = '·';

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

const fallbackBase =
  'bg-muted text-muted-foreground flex items-center justify-center';

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
        className={cn(fallbackBase, fallbackClassName)}
        aria-label={initials}
      >
        <User2 className="h-4 w-4 opacity-70" />
      </AvatarFallback>
    </Avatar>
  );
};

export const formatAvatarUrl = normalizeAvatarUrl;
