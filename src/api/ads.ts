import { apiFetch } from './client';

export interface Ad {
  id: string;
  title: string;
  media_type: 'image' | 'video';
  media_url: string;
  link_url: string | null;
}

/** No auth required on the backend — matches GET /api/ads?page=&position= (see ads.controller.js). */
export function getAds(page: string, position: 'top' | 'middle' | 'bottom' = 'middle') {
  return apiFetch<{ success: true; data: Ad[] }>(`/ads?page=${encodeURIComponent(page)}&position=${position}`);
}
