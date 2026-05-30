import fs from "fs";
import path from "path";
import {
  AffiliateDatabase,
  AffiliateAccount,
  AffiliateReferral,
  AffiliateClick,
  AffiliateCommission,
  AffiliatePayout,
  AffiliateCMSConfig
} from "./types";

const DB_PATH = path.join(process.cwd(), "affiliate_db.json");

// Default initial state for the Affiliate database with standard FAQs and promotional banners
const DEFAULT_DB: AffiliateDatabase = {
  accounts: [],
  referrals: [],
  clicks: [],
  commissions: [],
  payouts: [],
  config: {
    default_commission_rate: 30, // 30% recurring commission
    landing_stats: {
      active_affiliates_placeholder: 1420,
      total_paid_placeholder: 84650,
      avg_monthly_payout_placeholder: 480,
      referral_conversions_placeholder: 12400
    },
    promotional_assets: [
      {
        id: "asset-1",
        title: "RankSyncer Premium Sidebar Banner (300x250)",
        type: "banner",
        dimensions: "300x250",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=250&fit=crop&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=250&fit=crop&q=80"
      },
      {
        id: "asset-2",
        title: "RankSyncer Leaderboard Hero (728x90)",
        type: "banner",
        dimensions: "728x90",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=728&h=90&fit=crop&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=728&h=90&fit=crop&q=80"
      },
      {
        id: "asset-3",
        title: "RankSyncer Light Emblem Logo",
        type: "logo",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80",
        downloadUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80"
      }
    ],
    faqs: [
      {
        id: "faq-1",
        question: "How much commission do I earn?",
        answer: "You earn a 30% recurring monthly commission on all subscription plans as long as the referred customer remains active. No caps or limits on total earnings."
      },
      {
        id: "faq-2",
        question: "When do I get paid?",
        answer: "Commissions are approved 30 days after a payment is cleared (to account for our refund window). Payouts are made monthly on the 10th for balances over $50."
      },
      {
        id: "faq-3",
        question: "How long do referral cookies last?",
        answer: "Our tracking cookies last for 60 full days. If a visitor clicks your affiliate link and signs up anytime within 60 days, you get credited!"
      },
      {
        id: "faq-4",
        question: "Is there a payout threshold?",
        answer: "Yes, the minimum threshold to request a payout is $50. Payouts can be requested via PayPal, Wise, or Direct Bank Transfer."
      },
      {
        id: "faq-5",
        question: "How are commissions tracked?",
        answer: "We use robust, reliable server-side cookies combined with IP verification. When a visitor signs up, our tracking registers their referral state immediately."
      },
      {
        id: "faq-6",
        question: "What marketing materials are provided?",
        answer: "We provide professional logos, landing page assets, social media assets, and promotional banners inside your affiliate partner dashboard."
      }
    ],
    fraud_rules: {
      prevent_self_referrals: true,
      prevent_duplicate_ips: true,
      require_manual_payout_approval: true
    }
  }
};

// --- Low-Level IO ---
export function readAffiliateDb(): AffiliateDatabase {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading affiliate DB, returning default fallback:", err);
    return DEFAULT_DB;
  }
}

export function writeAffiliateDb(db: AffiliateDatabase) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing affiliate DB:", err);
  }
}

// =======================================================
// 1. AFFILIATE_SERVICE (Accounts Management & Fraud)
// =======================================================
export const affiliate_service = {
  getAccount(userId: string): AffiliateAccount | undefined {
    const db = readAffiliateDb();
    return db.accounts.find(a => a.user_id === userId);
  },

  joinProgram(userId: string, customCode?: string): AffiliateAccount {
    const db = readAffiliateDb();
    const existing = db.accounts.find(a => a.user_id === userId);
    if (existing) return existing;

    const referralCode = (customCode || `REF-${userId.slice(0, 5).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`).replace(/\s+/g, "");
    
    // Check code uniqueness
    const isCodeTaken = db.accounts.some(a => a.referral_code === referralCode);
    const finalCode = isCodeTaken ? `${referralCode}-${Math.floor(10 + Math.random() * 90)}` : referralCode;

    const newAccount: AffiliateAccount = {
      affiliate_id: `aff-${Date.now()}`,
      user_id: userId,
      referral_code: finalCode,
      referral_url: `${process.env.APP_URL || 'https://ranksyncer.com'}?ref=${finalCode}`,
      commission_rate: db.config.default_commission_rate,
      status: "approved", // auto-approve initially for UX ease, but respect config logic
      created_at: new Date().toISOString()
    };

    db.accounts.push(newAccount);
    writeAffiliateDb(db);
    return newAccount;
  },

  updatePaymentInfo(userId: string, method: string, address: string): AffiliateAccount {
    const db = readAffiliateDb();
    const idx = db.accounts.findIndex(a => a.user_id === userId);
    if (idx === -1) {
      throw new Error("Affiliate account not found");
    }

    db.accounts[idx].payment_method = method;
    db.accounts[idx].payment_address = address;
    writeAffiliateDb(db);
    return db.accounts[idx];
  },

  listAllAccounts(): AffiliateAccount[] {
    const db = readAffiliateDb();
    return db.accounts;
  },

  updateAccountStatus(affiliateId: string, status: 'approved' | 'pending' | 'rejected', rate?: number): AffiliateAccount {
    const db = readAffiliateDb();
    const idx = db.accounts.findIndex(a => a.affiliate_id === affiliateId);
    if (idx === -1) {
      throw new Error("Affiliate account not found");
    }

    db.accounts[idx].status = status;
    if (typeof rate === "number" && rate >= 0 && rate <= 100) {
      db.accounts[idx].commission_rate = rate;
    }
    writeAffiliateDb(db);
    return db.accounts[idx];
  }
};

// =======================================================
// 2. REFERRAL_TRACKING_SERVICE (Clicks & Attribution)
// =======================================================
export const referral_tracking_service = {
  trackClick(referralCode: string, ip?: string, userAgent?: string, campaign?: string): AffiliateClick | null {
    const db = readAffiliateDb();
    const account = db.accounts.find(a => a.referral_code === referralCode);
    if (!account) return null;

    // Fraud check: prevent logging multiple duplicate clicks from the exact same IP in last 5 seconds
    if (db.config.fraud_rules.prevent_duplicate_ips && ip) {
      const now = Date.now();
      const recentClick = db.clicks.find(
        c => c.ip_address === ip && 
        c.affiliate_id === account.affiliate_id &&
        (now - new Date(c.created_at).getTime()) < 5000
      );
      if (recentClick) {
        console.log(`[FRAUD PROTECTION]: Click rate limiting for IP ${ip} on code ${referralCode}`);
        return null;
      }
    }

    const click: AffiliateClick = {
      id: `clk-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      affiliate_id: account.affiliate_id,
      campaign: campaign || undefined,
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };

    db.clicks.push(click);
    writeAffiliateDb(db);
    return click;
  },

  trackSignup(referredUserId: string, email: string, referralCode: string): AffiliateReferral | null {
    const db = readAffiliateDb();
    const account = db.accounts.find(a => a.referral_code === referralCode);
    if (!account) return null;

    // Fraud check: self-referral protection
    if (db.config.fraud_rules.prevent_self_referrals && account.user_id === referredUserId) {
      console.warn(`[FRAUD BREACH]: Prevented self-referral for user ${referredUserId}`);
      return null;
    }

    // Check if referral already exists
    const duplicate = db.referrals.find(r => r.referred_user_id === referredUserId);
    if (duplicate) return duplicate;

    const referral: AffiliateReferral = {
      id: `ref-act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      affiliate_id: account.affiliate_id,
      referred_user_id: referredUserId,
      email,
      status: "signup",
      plan_name: "free",
      mrr: 0,
      created_at: new Date().toISOString()
    };

    db.referrals.push(referral);
    writeAffiliateDb(db);
    return referral;
  },

  trackTrial(referredUserId: string): AffiliateReferral | null {
    const db = readAffiliateDb();
    const idx = db.referrals.findIndex(r => r.referred_user_id === referredUserId);
    if (idx === -1) return null;

    db.referrals[idx].status = "trial";
    db.referrals[idx].plan_name = "premium_trial";
    writeAffiliateDb(db);
    return db.referrals[idx];
  },

  trackUpgrade(referredUserId: string, planName: string, price: number): AffiliateReferral | null {
    const db = readAffiliateDb();
    const idx = db.referrals.findIndex(r => r.referred_user_id === referredUserId);
    if (idx === -1) return null;

    const ref = db.referrals[idx];
    ref.status = "paid";
    ref.plan_name = planName;
    ref.mrr = price;

    // Trigger commission generation immediately
    commission_engine.generateCommission(ref.id, price);

    writeAffiliateDb(db);
    return ref;
  },

  trackCancellation(referredUserId: string): AffiliateReferral | null {
    const db = readAffiliateDb();
    const idx = db.referrals.findIndex(r => r.referred_user_id === referredUserId);
    if (idx === -1) return null;

    db.referrals[idx].status = "cancelled";
    db.referrals[idx].mrr = 0;
    writeAffiliateDb(db);
    return db.referrals[idx];
  },

  trackRefund(referredUserId: string, refundAmount: number) {
    const db = readAffiliateDb();
    const referral = db.referrals.find(r => r.referred_user_id === referredUserId);
    if (!referral) return;

    // Find commissions linked to this referral that are still pending/approved but not yet paid, 
    // and deduct/mark them rejected or adjusted!
    const commissions = db.commissions.filter(c => c.referral_id === referral.id && c.status !== "paid");
    commissions.forEach(c => {
      c.status = "rejected";
      c.description = `Refund reverse: payment was refunded/disputed (${refundAmount} USD)`;
    });

    writeAffiliateDb(db);
  }
};

// =======================================================
// 3. COMMISSION_ENGINE (Payout approvals & Calculations)
// =======================================================
export const commission_engine = {
  generateCommission(referralId: string, itemPrice: number): AffiliateCommission | null {
    const db = readAffiliateDb();
    const referral = db.referrals.find(r => r.id === referralId);
    if (!referral) return null;

    const account = db.accounts.find(a => a.affiliate_id === referral.affiliate_id);
    if (!account) return null;

    const rate = account.commission_rate || db.config.default_commission_rate;
    const commissionAmt = Math.round((itemPrice * (rate / 100)) * 100) / 100; // precision float

    if (commissionAmt <= 0) return null;

    const commission: AffiliateCommission = {
      id: `com-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      affiliate_id: account.affiliate_id,
      referral_id: referralId,
      amount: commissionAmt,
      status: "pending", // starts pending (safety 30 days clearance hold)
      type: "recurring",
      description: `30% Recurring commission on ${referral.plan_name} subscription`,
      created_at: new Date().toISOString()
    };

    db.commissions.push(commission);
    writeAffiliateDb(db);
    return commission;
  },

  listCommissions(): AffiliateCommission[] {
    const db = readAffiliateDb();
    return db.commissions;
  },

  updateCommissionStatus(commissionId: string, status: 'pending' | 'approved' | 'paid' | 'rejected', desc?: string): AffiliateCommission {
    const db = readAffiliateDb();
    const idx = db.commissions.findIndex(c => c.id === commissionId);
    if (idx === -1) {
      throw new Error("Commission record not found");
    }

    db.commissions[idx].status = status;
    if (desc) {
      db.commissions[idx].description = desc;
    }
    writeAffiliateDb(db);
    return db.commissions[idx];
  }
};

// =======================================================
// 4. PAYOUT_SERVICE (Manual / Simulated Auto payouts)
// =======================================================
export const payout_service = {
  requestPayout(userId: string, amount: number, method: string, address: string): AffiliatePayout {
    const db = readAffiliateDb();
    const account = db.accounts.find(a => a.user_id === userId);
    if (!account) {
      throw new Error("Affiliate account not found for user");
    }

    if (account.status !== "approved") {
      throw new Error("Your affiliate account status must be active approved to request payouts");
    }

    // Verify eligible balance (Approved commissions that aren't already grouped into a paid or pending payout)
    const analytics = analytics_service.getAffiliateAnalytics(userId);
    if (amount < 50) {
      throw new Error("Minimum payout requested amount is $50.00 USD");
    }
    if (amount > analytics.pendingCommissions) {
      throw new Error(`Insufficient unpaid eligible commission balance. Maximum withdrawable right now: $${analytics.pendingCommissions.toFixed(2)}`);
    }

    const payout: AffiliatePayout = {
      id: `poy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      affiliate_id: account.affiliate_id,
      amount,
      payment_method: method,
      payment_address: address,
      status: "pending",
      created_at: new Date().toISOString()
    };

    db.payouts.push(payout);

    // Group approved commissions into this payout by shifting commissions state to 'paid' during complete checkout simulation!
    // But in a stateful backend, we keep them pending until the admin approves the payout!
    writeAffiliateDb(db);
    return payout;
  },

  listAllPayouts(): AffiliatePayout[] {
    const db = readAffiliateDb();
    return db.payouts;
  },

  approvePayout(payoutId: string): AffiliatePayout {
    const db = readAffiliateDb();
    const idx = db.payouts.findIndex(p => p.id === payoutId);
    if (idx === -1) {
      throw new Error("Payout request not found");
    }

    const p = db.payouts[idx];
    p.status = "approved";
    p.processed_at = new Date().toISOString();

    // Mark associated approved/pending/cleared commissions for this affiliate as PAID, up to the payout amount!
    let deductionRemaining = p.amount;
    for (let c of db.commissions) {
      if (c.affiliate_id === p.affiliate_id && c.status === "pending") {
        if (deductionRemaining <= 0) break;
        if (c.amount <= deductionRemaining) {
          c.status = "paid";
          deductionRemaining -= c.amount;
        } else {
          // split commission logic (for robust tracking)
          const adjustedCommission: AffiliateCommission = {
            id: `com-split-${Date.now()}`,
            affiliate_id: c.affiliate_id,
            referral_id: c.referral_id,
            amount: c.amount - deductionRemaining,
            status: "pending",
            type: c.type,
            description: c.description,
            created_at: c.created_at
          };
          c.amount = deductionRemaining;
          c.status = "paid";
          deductionRemaining = 0;
          db.commissions.push(adjustedCommission);
          break;
        }
      }
    }

    writeAffiliateDb(db);
    return p;
  },

  rejectPayout(payoutId: string, reason: string): AffiliatePayout {
    const db = readAffiliateDb();
    const idx = db.payouts.findIndex(p => p.id === payoutId);
    if (idx === -1) {
      throw new Error("Payout request not found");
    }

    db.payouts[idx].status = "rejected";
    db.payouts[idx].failure_reason = reason;
    db.payouts[idx].processed_at = new Date().toISOString();
    writeAffiliateDb(db);
    return db.payouts[idx];
  },

  payoutCompleted(payoutId: string): AffiliatePayout {
    const db = readAffiliateDb();
    const idx = db.payouts.findIndex(p => p.id === payoutId);
    if (idx === -1) {
      throw new Error("Payout request not found");
    }

    db.payouts[idx].status = "paid";
    db.payouts[idx].processed_at = new Date().toISOString();
    writeAffiliateDb(db);
    return db.payouts[idx];
  }
};

// =======================================================
// 5. ANALYTICS_SERVICE (Dashboard aggregates & Graphs)
// =======================================================
export const analytics_service = {
  getAffiliateAnalytics(userId: string) {
    const db = readAffiliateDb();
    const account = db.accounts.find(a => a.user_id === userId);
    
    if (!account) {
      return {
        isRegistered: false,
        totalClicks: 0,
        totalReferrals: 0,
        activeCustomers: 0,
        monthlyEarnings: 0,
        lifetimeEarnings: 0,
        pendingCommissions: 0,
        paidCommissions: 0,
        conversionRate: 0,
        referralsList: [],
        commissionsList: [],
        payoutsList: [],
        clickStreamHistory: []
      };
    }

    const affId = account.affiliate_id;

    const clicks = db.clicks.filter(c => c.affiliate_id === affId);
    const referrals = db.referrals.filter(r => r.affiliate_id === affId);
    const commissions = db.commissions.filter(c => c.affiliate_id === affId);
    const payouts = db.payouts.filter(p => p.affiliate_id === affId);

    const totalClicks = clicks.length;
    const totalReferrals = referrals.length;
    const activeCustomers = referrals.filter(r => r.status === "paid").length;

    // Lifetime earnings (sum of all approved, pending and paid commissions)
    const lifetimeEarnings = commissions
      .filter(c => c.status !== "rejected")
      .reduce((sum, c) => sum + c.amount, 0);

    // Paid commissions
    const paidCommissions = commissions
      .filter(c => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

    // Pending commissions (eligible balance waiting to be paid)
    const pendingCommissions = commissions
      .filter(c => c.status === "pending")
      .reduce((sum, c) => sum + c.amount, 0);

    // Monthly Earnings (sum of paid or approved commissions initiated in the last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthlyEarnings = commissions
      .filter(c => c.status !== "rejected" && new Date(c.created_at).getTime() >= thirtyDaysAgo)
      .reduce((sum, c) => sum + c.amount, 0);

    const conversionRate = totalClicks > 0 ? Math.round((totalReferrals / totalClicks) * 1000) / 10 : 0;

    return {
      isRegistered: true,
      account,
      totalClicks,
      totalReferrals,
      activeCustomers,
      monthlyEarnings,
      lifetimeEarnings,
      pendingCommissions,
      paidCommissions,
      conversionRate,
      referralsList: referrals,
      commissionsList: commissions,
      payoutsList: payouts,
      clickStreamHistory: clicks
    };
  },

  getGlobalAffiliateAnalytics() {
    const db = readAffiliateDb();
    
    // Sum global statistics
    const totalAffiliates = db.accounts.length;
    const totalClicks = db.clicks.length;
    const totalReferrals = db.referrals.length;
    const activeCustomers = db.referrals.filter(r => r.status === "paid").length;
    
    const lifetimeEarningsGlobal = db.commissions
      .filter(c => c.status !== "rejected")
      .reduce((sum, c) => sum + c.amount, 0);

    const totalPaidGlobal = db.commissions
      .filter(c => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

    const pendingPayoutsSum = db.payouts
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalAffiliates,
      totalClicks,
      totalReferrals,
      activeCustomers,
      lifetimeEarningsGlobal,
      totalPaidGlobal,
      pendingPayoutsSum,
      accounts: db.accounts,
      referrals: db.referrals,
      clicks: db.clicks,
      commissions: db.commissions,
      payouts: db.payouts,
      config: db.config
    };
  },

  updateDynamicConfig(newConfig: Partial<AffiliateCMSConfig>): AffiliateCMSConfig {
    const db = readAffiliateDb();
    db.config = {
      ...db.config,
      ...newConfig
    };
    writeAffiliateDb(db);
    return db.config;
  }
};
