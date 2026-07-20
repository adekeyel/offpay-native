import { apiFetch } from './client';
import type { UserProfile } from '../types/api';

export function getProfile() {
  return apiFetch<{ success: true; data: UserProfile }>('/users/me', { cacheKey: 'profile' });
}

export function setTransactionPin(pin: string, currentPassword: string) {
  return apiFetch<{ success: true; message: string }>('/users/pin', { method: 'POST', body: { pin, currentPassword } });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<{ success: true; message: string }>('/users/change-password', {
    method: 'POST', body: { currentPassword, newPassword },
  });
}

/**
 * Submits a request to upgrade KYC tier. formData must contain: nin, address,
 * and two files under the keys 'ninSlip' and 'utilityBill' — see
 * TierUpgradeScreen for how these are built (same File-append pattern as
 * RegisterScreen's passport upload).
 */
export function requestTierUpgrade(formData: FormData) {
  return apiFetch<{ success: true; message: string }>('/users/tier-upgrade', {
    method: 'POST', body: formData, isForm: true,
  });
}
