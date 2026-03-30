import { apiClient } from '@/lib/api-client';

export interface DownloadRequestData {
  media_id: string;
  media_type: 'IMAGE' | 'VIDEO';
  download_url: string;
  filename?: string;
}

export class DownloadService {
  static async requestDownload(mediaId: string): Promise<DownloadRequestData> {
    const response = await apiClient.post<{ success: boolean; data: DownloadRequestData }>(
      `/media/${mediaId}/download`,
      {},
      { withAuth: false },
    );
    return response.data;
  }
}
