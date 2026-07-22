import { apiFetch } from './client';

export interface SecuritySettings {
  transfer_protection_enabled: boolean;
  biometrics_enabled: boolean;
  google2fa_enabled: boolean;
  email2fa_withdrawals_enabled: boolean;
  passcode_set: boolean;
}

export function getSettings() {
  return apiFetch<{ success: true; data: SecuritySettings }>('/security');
}

export function setTransferProtection(enabled: boolean) {
  return apiFetch<{ success: true; message: string }>('/security/transfer-protection', { method: 'POST', body: { enabled } });
}

export function setBiometrics(enabled: boolean) {
  return apiFetch<{ success: true; message: string }>('/security/biometrics', { method: 'POST', body: { enabled } });
}

export function startGoogle2fa() {
  return apiFetch<{ success: true; data: { secret: string; otpauthUrl: string; qrDataUrl: string } }>('/security/google-2fa/start', { method: 'POST' });
}

export function confirmGoogle2fa(code: string) {
  return apiFetch<{ success: true; message: string }>('/security/google-2fa/confirm', { method: 'POST', body: { code } });
}

export function disableGoogle2fa() {
  return apiFetch<{ success: true; message: string }>('/security/google-2fa/disable', { method: 'POST' });
}

export function setEmail2fa(enabled: boolean) {
  return apiFetch<{ success: true; message: string }>('/security/email-2fa', { method: 'POST', body: { enabled } });
}

/** Requests the emailed transfer OTP — only relevant when email 2FA (not Google 2FA) is the active method. Only ever called while online. */
export function requestTransferOtp() {
  return apiFetch<{ success: true; message: string }>('/security/transfer-otp/request', { method: 'POST' });
}
