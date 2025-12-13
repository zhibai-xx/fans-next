export interface MediaSourceMetadata {
  platform?: string;
  author?: string;
  reference_url?: string;
  ingestUserId?: string;
  originalPath?: string;
  sourcePipeline?: string;
  importedAt?: string;
  [key: string]: unknown;
}
