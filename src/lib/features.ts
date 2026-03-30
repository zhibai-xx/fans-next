export const isVideoFeatureEnabled =
  process.env.NEXT_PUBLIC_ENABLE_VIDEO_FEATURE === 'true';

export const availableSystemIngestTypes = isVideoFeatureEnabled
  ? (['all', 'image', 'video', 'gif'] as const)
  : (['all', 'image', 'gif'] as const);

export type AvailableSystemIngestType =
  (typeof availableSystemIngestTypes)[number];
