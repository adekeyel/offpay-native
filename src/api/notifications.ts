import { apiFetch } from './client';

export interface UserNotification {
  id: string;
  type: 'login' | 'app' | 'update' | 'support';
  title: string;
  message: string;
  related_type: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function getNotifications() {
  return apiFetch<{ success: true; data: UserNotification[] }>('/users/notifications');
}

export function getUnreadCount() {
  return apiFetch<{ success: true; data: { count: number } }>('/users/notifications/unread-count');
}

export function markNotificationRead(id: string) {
  return apiFetch<{ success: true }>(`/users/notifications/${id}/read`, { method: 'POST' });
}

export function markAllNotificationsRead() {
  return apiFetch<{ success: true }>('/users/notifications/read-all', { method: 'POST' });
}
