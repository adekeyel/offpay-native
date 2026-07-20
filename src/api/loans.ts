import { apiFetch } from './client';
import type { LoanProduct, Loan } from '../types/api';

export function getLoanProducts() {
  return apiFetch<{ success: true; data: LoanProduct[] }>('/loans/products', { cacheKey: 'loan-products' });
}

export function getActiveLoan() {
  return apiFetch<{ success: true; data: Loan | null }>('/loans/active', { cacheKey: 'active-loan' });
}

export function requestLoan(loanProductId: string, amount: number) {
  return apiFetch<{ success: true; message: string; data: Loan }>('/loans/request', {
    method: 'POST', body: { loanProductId, amount },
  });
}

export function repayLoan(amount: number) {
  return apiFetch<{ success: true; message: string; data: Loan }>('/loans/repay', {
    method: 'POST', body: { amount },
  });
}
