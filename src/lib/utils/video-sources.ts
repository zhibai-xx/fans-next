import type { CSSProperties } from 'react';

import { resolveMediaVideoUrl, getVideoMimeType } from '@/lib/utils/media-url';
import type { MediaItem } from '@/services/media.service';
import type { VideoSource } from '@/components/video/RobustVideoPlayer';

interface VideoLike {
  url: string;
  quality?: string;
  height?: number;
  width?: number;
}

interface MediaLike {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  hls_url?: string | null;
  video_qualities?: VideoLike[] | null;
  width?: number | null;
  height?: number | null;
  media_type?: string;
}

type BuildMedia = Pick<
  MediaItem,
  |
    'id'
  |
    'url'
  |
    'thumbnail_url'
  |
    'hls_url'
  |
    'video_qualities'
  |
    'width'
  |
    'height'
  |
    'media_type'
> | MediaLike;

interface BuildVideoSourceOptions {
  isAuthenticated?: boolean;
  loginLabel?: string;
}

const isDev = process.env.NODE_ENV !== 'production';

const addSourceIfValid = (
  list: VideoSource[],
  candidate: VideoSource | null
) => {
  if (!candidate || !candidate.src) return;
  const normalized = candidate.src.trim();
  if (!normalized) return;
  const exists = list.some((source) => source.src === normalized);
  if (!exists) {
    list.push({
      ...candidate,
      src: normalized
    });
  }
};

export const buildVideoSources = (
  media: BuildMedia,
  options: BuildVideoSourceOptions = {},
): VideoSource[] => {
  if (!media || !media.url) {
    return [];
  }

  const { isAuthenticated = false, loginLabel = '登录观看' } = options;

  const qualityEntries: VideoSource[] = [];
  const qualities = Array.isArray(media.video_qualities)
    ? media.video_qualities
    : [];

  const pushQuality = (
    source: VideoSource,
    requiresAuth: boolean,
  ) => {
    const entry: VideoSource = {
      ...source,
      requiresAuth,
      displayLabel: requiresAuth && source.label
        ? `${source.label}(${loginLabel})`
        : source.label,
    };
    if (!entry.displayLabel && entry.label) {
      entry.displayLabel = entry.label;
    }
    qualityEntries.push(entry);
  };

  const pushProcessedOriginal = () => {
    if (!media.id) return;
    const fallbackOriginal = `/processed/${media.id}/source/original.mp4`;
    const resolved = resolveMediaVideoUrl(fallbackOriginal);
    if (resolved && !resolved.startsWith('/Users/')) {
      pushQuality(
        {
          src: resolved,
          type: 'video/mp4',
          label: '原画',
          quality: 'ORIGINAL',
          height: media.height ?? undefined,
          width: media.width ?? undefined,
        },
        !isAuthenticated && (media.height || 0) > 720,
      );
    }
  };

  if (qualities.length > 0) {
    qualities.forEach((quality) => {
      let formattedUrl = resolveMediaVideoUrl(quality.url);
      if (!formattedUrl || formattedUrl.startsWith('/Users/')) return;

      const qualityNameRaw = quality.quality || '';
      const qualityKey = qualityNameRaw.toUpperCase();
      const isOriginal = qualityKey === 'ORIGINAL';

      if (getVideoMimeType(formattedUrl) === 'video/quicktime') {
        if (media.id) {
          formattedUrl = resolveMediaVideoUrl(
            `/processed/${media.id}/source/original.mp4`,
          );
        }
      }

      if (!formattedUrl || formattedUrl.startsWith('/Users/')) {
        return;
      }

      const baseLabel = isOriginal
        ? '原画'
        : qualityNameRaw || (quality.height ? `${quality.height}p` : '清晰度');
      const height = quality.height || undefined;
      const requiresAuth = !isAuthenticated && !!height && height > 720;

      pushQuality(
        {
          src: formattedUrl,
          type: getVideoMimeType(formattedUrl),
          label: baseLabel,
          quality: qualityKey || qualityNameRaw || baseLabel,
          height,
          width: quality.width,
        },
        requiresAuth,
      );
    });
  } else {
    let formattedUrl = resolveMediaVideoUrl(media.url);
    if (formattedUrl && !formattedUrl.startsWith('/Users/')) {
      if (getVideoMimeType(formattedUrl) === 'video/quicktime') {
        formattedUrl = media.id
          ? resolveMediaVideoUrl(`/processed/${media.id}/source/original.mp4`)
          : formattedUrl;
      }

      if (formattedUrl && !formattedUrl.startsWith('/Users/')) {
        const requiresAuth = !isAuthenticated && (media.height || 0) > 720;
        pushQuality(
          {
            src: formattedUrl,
            type: getVideoMimeType(formattedUrl),
            label: '原画',
            quality: 'ORIGINAL',
            height: media.height ?? undefined,
            width: media.width ?? undefined,
          },
          requiresAuth,
        );
      }
    }
  }

  if (qualityEntries.length === 0) {
    pushProcessedOriginal();
  }

  if (qualityEntries.length === 0) {
    return [];
  }

  if (
    qualityEntries.length === 1 &&
    (qualityEntries[0].quality === 'ORIGINAL' || qualityEntries[0].label === '原画')
  ) {
    qualityEntries[0].requiresAuth = false;
    if (qualityEntries[0].label) {
      qualityEntries[0].displayLabel = qualityEntries[0].label;
    }
  }

  const sortWeight = (source: VideoSource): number => {
    if (source.quality?.toUpperCase() === 'ORIGINAL') {
      return Number.MAX_SAFE_INTEGER;
    }
    if (source.height) {
      return source.height;
    }
    const match = source.label?.match(/(\d{3,4})p/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return source.requiresAuth ? 0 : 1;
  };

  const sortedByQuality = [...qualityEntries].sort((a, b) => {
    const diff = sortWeight(b) - sortWeight(a);
    if (diff !== 0) return diff;
    const qualA = a.quality || '';
    const qualB = b.quality || '';
    return qualB.localeCompare(qualA);
  });

  const preferredIndex = sortedByQuality.findIndex(
    (source) => !source.requiresAuth && source.quality === '720P',
  );
  const firstAccessible = sortedByQuality.findIndex(
    (source) => !source.requiresAuth,
  );
  const defaultIndex =
    preferredIndex >= 0
      ? preferredIndex
      : firstAccessible >= 0
      ? firstAccessible
      : 0;

  const ordered = sortedByQuality.map((source, index) => ({
    ...source,
    isDefault: index === defaultIndex,
  }));

  if (media.hls_url) {
    const hlsUrl = resolveMediaVideoUrl(media.hls_url);
    addSourceIfValid(
      ordered,
      hlsUrl
        ? {
            src: hlsUrl,
            type: 'application/x-mpegURL',
            label: 'HLS',
            displayLabel: 'HLS',
          }
        : null,
    );
  }

  if (isDev) {
    console.log('🎯 buildVideoSources 调试信息:', {
      mediaId: media.id,
      mediaType: media.media_type,
      originalUrl: media.url,
      hlsUrl: media.hls_url,
      qualitiesCount: qualities.length,
      orderedSources: ordered,
    });
  }

  return ordered;
};

export const getPosterUrl = (media: BuildMedia): string | undefined => {
  if (!media.thumbnail_url) return undefined;
  const poster = resolveMediaVideoUrl(media.thumbnail_url);
  return poster || undefined;
};

interface VideoContainerOptions {
  maxWidth?: number;
  maxHeight?: string;
  portraitWidth?: number;
}

export const getVideoContainerStyle = (
  media: BuildMedia,
  options: VideoContainerOptions = {}
): CSSProperties => {
  const { maxWidth = 800, maxHeight = '70vh', portraitWidth = 420 } = options;

  let width = media.width ?? undefined;
  let height = media.height ?? undefined;

  if ((!width || !height) && Array.isArray(media.video_qualities)) {
    const originalQuality = media.video_qualities.find(
      (quality) => quality?.quality?.toUpperCase() === 'ORIGINAL',
    );
    const sortedQualities = [...media.video_qualities].sort(
      (a, b) => (b?.height ?? 0) - (a?.height ?? 0),
    );
    const fallbackQuality = originalQuality ?? sortedQualities[0];

    if (fallbackQuality?.width && fallbackQuality?.height) {
      width = fallbackQuality.width;
      height = fallbackQuality.height;
    }
  }

  if (!width || !height) {
    return {
      aspectRatio: '16 / 9',
      width: '100%',
      maxWidth: `${maxWidth}px`,
      maxHeight,
      margin: '0 auto'
    };
  }

  const ratio = width / height;
  const isPortrait = ratio < 0.8;

  if (isPortrait) {
    return {
      aspectRatio: `${width} / ${height}`,
      width: `min(100%, ${portraitWidth}px)`,
      margin: '0 auto'
    };
  }

  return {
    aspectRatio: `${width} / ${height}`,
    width: '100%',
    maxWidth: `${maxWidth}px`,
    maxHeight,
    margin: '0 auto'
  };
};
