export interface AffiliateAccount {
  affiliate_id: string;
  user_id: string;
  referral_code: string;
  referral_url: string;
  commission_rate: number; // default: 30
  status: 'approved' | 'pending' | 'rejected';
  payment_method?: string; // 'paypal' | 'wise' | 'stripe'
  payment_address?: string;
  created_at: string;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  email: string;
  status: 'signup' | 'trial' | 'paid' | 'cancelled';
  plan_name: string;
  mrr: number; // monthly recurring revenue
  created_at: string;
}

export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  campaign?: string; // utm_campaign
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referral_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  type: 'recurring' | 'one-time';
  description?: string;
  created_at: string;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  amount: number;
  payment_method: string;
  payment_address: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  processed_at?: string;
  failure_reason?: string;
}

export interface PromotionalAsset {
  id: string;
  title: string;
  type: 'banner' | 'logo' | 'social';
  dimensions?: string;
  imageUrl: string;
  downloadUrl: string;
}

export interface AffiliateFaq {
  id: string;
  question: string;
  answer: string;
}

export interface AffiliateCMSConfig {
  default_commission_rate: number;
  // Dynamic admin configurations for landing page
  landing_stats: {
    active_affiliates_placeholder: number;
    total_paid_placeholder: number;
    avg_monthly_payout_placeholder: number;
    referral_conversions_placeholder: number;
  };
  promotional_assets: PromotionalAsset[];
  faqs: AffiliateFaq[];
  fraud_rules: {
    prevent_self_referrals: boolean;
    prevent_duplicate_ips: boolean;
    require_manual_payout_approval: boolean;
  };
}

export interface AffiliateDatabase {
  accounts: AffiliateAccount[];
  referrals: AffiliateReferral[];
  clicks: AffiliateClick[];
  commissions: AffiliateCommission[];
  payouts: AffiliatePayout[];
  config: AffiliateCMSConfig;
}
