export interface User {
  id: string;
  fullName: string;
  email: string;
  status: string;
  kycStatus: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  appLockPinSet: boolean;
  user: User;
}

export interface WalletSummary {
  walletId: string;
  accountNumber: string | null;
  bankName: string | null;
  balance: number;
  confirmed: number;
  pending: number;
  totalIncludingPending: number;
  currency: string;
  isFrozen: boolean;
  offlineLock: {
    lockPercent: number;
    availablePercent: number;
    wouldLock: number;
    wouldBeAvailable: number;
  };
  activeOfflineToken: {
    issuedAt: string;
    expiresAt: string;
    offlineLimit: number;
    spentOffline: number;
    remaining: number;
  } | null;
}

export interface Transaction {
  id: string;
  reference: string;
  type: string;
  direction: 'debit' | 'credit';
  amount: string | number;
  fee: string | number;
  status: string;
  narration: string;
  created_at: string;
}

export interface VtuProduct {
  id: string;
  category: string;
  provider: string;
  name: string;
  amount: string | number;
}

export interface Card {
  id: string;
  masked_pan: string;
  last4: string;
  brand: string;
  expiry_month: number;
  expiry_year: number;
  status: 'active' | 'frozen' | 'blocked' | 'expired';
}

export interface LoanProduct {
  id: string;
  name: string;
  min_amount: string | number;
  max_amount: string | number;
  interest_rate: string | number;
  tenor_days: number;
  min_kyc_tier: number;
  min_account_age_days: number;
  active: boolean;
  eligibility: { eligible: boolean; reason?: string };
}

export interface Loan {
  id: string;
  product_name: string;
  principal: string | number;
  interest_amount: string | number;
  total_repayable: string | number;
  amount_repaid: string | number;
  status: 'pending' | 'approved' | 'active' | 'repaid' | 'defaulted' | 'rejected';
  due_date: string;
}

export interface WealthProduct {
  id: string;
  type: 'cashbox' | 'smartearn' | 'safebox' | 'target' | 'fixed' | 'mutual_fund';
  name: string;
  description: string;
  interest_rate: string | number;
  min_amount: string | number;
  lock_days: number;
}

export interface WealthAccount {
  id: string;
  product_name: string;
  type: string;
  interest_rate: string | number;
  balance: string | number;
  target_amount: string | number | null;
  target_date: string | null;
  maturity_date: string | null;
  status: string;
}

export interface CashbackEntry {
  id: string;
  amount: string | number;
  source: string;
  created_at: string;
}

export interface RewardsSummary {
  cashbackBalance: number;
  cashbackHistory: CashbackEntry[];
}

export interface OfflineVoucher {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: string | number;
  nonce: string;
  status: 'pending_sync' | 'confirmed' | 'failed' | 'expired';
  failure_reason: string | null;
  sender_name?: string;
  receiver_name?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  bvn: string | null;
  passport_url: string | null;
  status: string;
  kyc_status: string;
  kyc_tier: number;
  address: string | null;
  gender: 'male' | 'female' | null;
  date_of_birth: string | null;
  tier_upgrade_status: 'pending' | 'approved' | 'rejected' | null;
  tier_upgrade_notes: string | null;
  two_fa_enabled: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
}

/** Tier limits shown to the user when explaining what each KYC tier unlocks. */
export interface TierInfo {
  tier: number;
  name: string;
  dailyLimit: number;
  maxBalance: number;
}

export interface SupportTicket {
  id: string;
  user_id: string | null;
  subject: string;
  message: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  last_reply_message?: string | null;
  last_reply_author_type?: 'user' | 'admin' | null;
  last_reply_at?: string | null;
}

export interface SupportReply {
  id: string;
  author_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  details?: unknown;
}
