export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const API_BASE_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
const isDev = process.env.NODE_ENV !== 'production';

const isAbsoluteUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

const ensureLeadingSlash = (path: string): string => {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  return path;
};

/**
 * 生成图片访问地址，确保指向正确的后端服务
 */
export const resolveMediaImageUrl = (url: string | null | undefined): string => {
  if (!url) {
    return '/placeholder-image.svg';
  }

  if (isAbsoluteUrl(url)) {
    return url;
  }

  if (url.startsWith('/api/upload/file/')) {
    return `${API_BASE_ORIGIN}${url}`;
  }

  if (url.startsWith('uploads/')) {
    const pathParts = url.replace('uploads/', '');
    return `${API_BASE_ORIGIN}/api/upload/file/${pathParts}`;
  }

  if (url.startsWith('/')) {
    return `${API_BASE_ORIGIN}${url}`;
  }

  return `${API_BASE_ORIGIN}/api/upload/file/${url}`;
};

/**
 * 生成视频访问地址，优先返回可被 Next 代理的相对路径
 */
export const resolveMediaVideoUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    if (isDev) {
      console.warn('resolveMediaVideoUrl: 无效URL', url);
    }
    return '';
  }

  const cleanUrl = url.trim();

  if (cleanUrl.startsWith(`${API_BASE_ORIGIN}/`)) {
    const path = cleanUrl.replace(API_BASE_ORIGIN, '');
    if (path.startsWith('/api/')) {
      if (path.startsWith('/api/upload/file/processed/')) {
        return ensureLeadingSlash(path.replace('/api/upload/file', ''));
      }
      return path;
    }
    return ensureLeadingSlash(path);
  }

  if (cleanUrl.startsWith(`${API_BASE_ORIGIN.replace(/\/$/, '')}/api/upload/file/processed/`)) {
    const stripped = cleanUrl.replace(`${API_BASE_ORIGIN.replace(/\/$/, '')}/api/upload/file`, '');
    return ensureLeadingSlash(stripped);
  }

  if (cleanUrl.startsWith('http://localhost:3000/api/upload/file/processed/')) {
    const stripped = cleanUrl.replace('http://localhost:3000/api/upload/file', '');
    return ensureLeadingSlash(stripped);
  }

  if (cleanUrl.startsWith('http://localhost:3000/')) {
    const path = cleanUrl.replace('http://localhost:3000/', '');
    return ensureLeadingSlash(path);
  }

  if (isAbsoluteUrl(cleanUrl)) {
    try {
      const parsed = new URL(cleanUrl);
      const host = parsed.origin;
      if (
        host === API_BASE_ORIGIN ||
        host === 'http://localhost:3000' ||
        host === 'http://localhost:3001'
      ) {
        if (parsed.pathname.startsWith('/processed/')) {
          return parsed.pathname;
        }
        if (parsed.pathname.startsWith('/uploads/')) {
          const uploadPath = parsed.pathname.replace('/uploads/', '');
          return `/api/upload/file/${uploadPath}`;
        }
      }
    } catch (error) {
      if (isDev) {
        console.warn('resolveMediaVideoUrl: URL解析失败', cleanUrl, error);
      }
    }
    return cleanUrl;
  }

  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith('uploads/processed/')) {
    const pathParts = cleanUrl.replace('uploads/processed/', '');
    return `/processed/${pathParts}`;
  }

  if (cleanUrl.startsWith('/uploads/processed/')) {
    return cleanUrl.replace('/uploads', '');
  }

  if (cleanUrl.startsWith('processed/')) {
    const pathParts = cleanUrl.replace('processed/', '');
    return `/processed/${pathParts}`;
  }

  if (cleanUrl.startsWith('uploads/')) {
    const pathParts = cleanUrl.replace('uploads/', '');
    if (!pathParts) {
      if (isDev) {
        console.warn('resolveMediaVideoUrl: uploads/路径无效', cleanUrl);
      }
      return '';
    }
    return `/api/upload/file/${pathParts}`;
  }

  let result = `/api/upload/file/${cleanUrl}`;

  // 兼容旧数据：/api/upload/file/http(s)://localhost:3000/processed/xxx
  result = result.replace(
    /\/api\/upload\/file\/https?:\/+[^/]+(\/processed\/.+)$/i,
    '$1',
  );
  result = result.replace(/^https?:\/+[^/]+(\/processed\/.+)$/i, '$1');

  if (result.startsWith('processed/')) {
    result = `/${result}`;
  }

  return result;
};

export const getMp4FallbackUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;

  const [base, query] = url.split('?');
  if (!base.toLowerCase().endsWith('.mov')) return null;

  const mp4Base = `${base.slice(0, -4)}.mp4`;
  return query ? `${mp4Base}?${query}` : mp4Base;
};

export const getVideoMimeType = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') {
    return 'video/mp4';
  }

  const cleanUrl = url.split('?')[0].toLowerCase();

  if (cleanUrl.endsWith('.mov')) return 'video/quicktime';
  if (cleanUrl.endsWith('.m4v')) return 'video/x-m4v';
  if (cleanUrl.endsWith('.webm')) return 'video/webm';
  if (cleanUrl.endsWith('.m3u8')) return 'application/x-mpegURL';
  if (cleanUrl.endsWith('.mpd')) return 'application/dash+xml';

  return 'video/mp4';
};

export const buildAbsoluteMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('/')) {
    return `${API_BASE_ORIGIN}${path}`;
  }
  return `${API_BASE_ORIGIN}/${path}`;
};
