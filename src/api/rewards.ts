import { apiFetch } from './client';
import type { RewardsSummary } from '../types/api';

export function getRewardsSummary() {
  return apiFetch<{ success: true; data: RewardsSummary }>('/rewards/summary', { cacheKey: 'rewards-summary' });
}
