import { DownloadService } from '@/services/download.service';
import { buildAbsoluteMediaUrl } from '@/lib/utils/media-url';
import { triggerBrowserDownload } from '@/lib/utils/download-helper';

export const requestMediaDownload = async (
  mediaId: string,
  fallbackName?: string,
) => {
  const data = await DownloadService.requestDownload(mediaId);
  const absoluteUrl = buildAbsoluteMediaUrl(data.download_url);
  triggerBrowserDownload(absoluteUrl, data.filename || fallbackName);
  return data;
};
