import { apiFetch } from './client';
import type { UserProfile } from '../types/api';

export function getProfile() {
  return apiFetch<{ success: true; data: UserProfile }>('/users/me');
}

export function setTransactionPin(pin: string, currentPassword: string) {
  return apiFetch<{ success: true; message: string }>('/users/pin', { method: 'POST', body: { pin, currentPassword } });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<{ success: true; message: string }>('/users/change-password', {
    method: 'POST', body: { currentPassword, newPassword },
  });
}
