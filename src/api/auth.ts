import { apiFetch } from './client';
import type { LoginResponse } from '../types/api';

export function register(formData: FormData) {
  return apiFetch<{ success: true; data: { userId: string; email: string; kycStatus: string } }>('/auth/register', {
    method: 'POST', body: formData, isForm: true,
  });
}

export function verifyEmailOtp(userId: string, code: string, deviceId: string) {
  return apiFetch<{ success: true; data: LoginResponse }>('/auth/verify-email-otp', {
    method: 'POST', body: { userId, code, deviceId },
  });
}

export function login(email: string, password: string, deviceId: string) {
  return apiFetch<{ success: true; data: LoginResponse }>('/auth/login', {
    method: 'POST', body: { email, password, deviceId },
  });
}

export function setAppLockPin(pin: string) {
  return apiFetch<{ success: true; message: string }>('/auth/set-app-lock-pin', {
    method: 'POST', body: { pin },
  });
}

export function unlock(refreshToken: string, pin: string) {
  return apiFetch<{ success: true; data: { accessToken: string; user: LoginResponse['user'] } }>('/auth/unlock', {
    method: 'POST', body: { refreshToken, pin }, skipAuthRetry: true,
  });
}

export function requestRecovery(email: string, type: string, reason?: string) {
  return apiFetch<{ success: true; message: string }>('/auth/recovery-request', {
    method: 'POST', body: { email, type, reason },
  });
}

export function logout(refreshToken: string | null) {
  return apiFetch<{ success: true }>('/auth/logout', { method: 'POST', body: { refreshToken } });
}
