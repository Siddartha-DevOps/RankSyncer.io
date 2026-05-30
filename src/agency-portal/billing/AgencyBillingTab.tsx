import React, { useState } from "react";
import { 
  Check, 
  CreditCard, 
  Building2, 
  Users, 
  HelpCircle, 
  ShieldCheck, 
  Percent, 
  Sparkles,
  Zap
} from "lucide-react";
import { Agency } from "../types";

interface AgencyBillingTabProps {
  agency: Agency;
  onUpdateTier: (tier: "starter" | "growth" | "enterprise") => Promise<void>;
}

export default function AgencyBillingTab({
  agency,
  onUpdateTier
}: AgencyBillingTabProps) {
  const [activeTier, setActiveTier] = useState(agency.tier);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const tiersList = [
    {
      id: "starter",
      name: "Starter Agency",
      price: "$199",
      period: "month",
      desc: "Perfect for scaling boutique consultancies and emerging SEO teams.",
      limits: { clients: "10 Portals", seats: "5 Coworkers", crawling: "Simulated crawler log analytics limit" },
      features: [
        "10 Branded Client Portals",
        "5 Team Coworker Seats",
        "Custom Brand Logo & Accent Themes",
        "Exportable PDF Executive Summaries",
        "Full Keyword Discovery Integration",
        "Isolated DB Tenant Sandboxes"
      ]
    },
    {
      id: "growth",
      name: "Growth Agency",
      price: "$399",
      period: "month",
      desc: "Our most popular package. Designed for full-time digital marketing agencies.",
      limits: { clients: "25 Portals", seats: "12 Coworkers", crawling: "Prioritized search engine crawling queues" },
      features: [
        "25 Branded Client Portals",
        "12 Team Coworker Seats",
        "Custom Domains setup routing",
        "Premium Email Sender Masking",
        "Prioritized SERP Bot Crawler logs",
        "Automatic SEO Audit lead captures",
        "Account Over ownership transfers"
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise Agency",
      price: "$799",
      period: "month",
      desc: "Fully unmetered layout parameters built for global client portfolios.",
      limits: { clients: "Unlimited Portals", seats: "Unlimited Coworkers", crawling: "Dedicated private SEO crawler nodes" },
      features: [
        "Uncapped Client Portal Vaults",
        "Uncapped Team Coworkers Slots",
        "Private dedicated SERP crawlers",
        "24/7 dedicated account engineers",
        "Custom API access endpoints",
        "Premium White-label asset assistance",
        "Multi-currency conversion dashboards"
      ]
    }
  ];

  const handleTierUpdate = async (tierId: "starter" | "growth" | "enterprise") => {
    if (tierId === activeTier) return;
    setIsUpdating(true);
    setMessage("");
    try {
      // Simulate/Trigger API update
      const res = await fetch("/api/agency/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: agency.agency_id,
          config: {
            ...agency.branding_config
          }
        })
      });
      const body = await res.json();
      if (body.success) {
        // Mocking the tier state update inside the parent
        await onUpdateTier(tierId);
        setActiveTier(tierId);
        setMessage(`Successfully upgraded workspace package to ${tierId.toUpperCase()}.`);
        setTimeout(() => setMessage(""), 5000);
      } else {
        alert("Billing network interface failed to sync.");
      }
    } catch (e: any) {
      alert(`Billing fault: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6" id="agency-billing-tab">
      
      {/* Header and top badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight">Flexible Seating & Capacity Packages</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Control agency subscription contracts, upgrade coworker seat allocations, and unlock unlimited portals.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl text-center self-start">
          <span className="text-[10px] font-black uppercase text-indigo-750 block">Current Active Plan</span>
          <span className="text-xs font-mono font-black text-indigo-700 uppercase tracking-widest">{activeTier} Agency Suite</span>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {/* Grid of Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiersList.map(tier => {
          const isActive = activeTier === tier.id;
          
          return (
            <div 
              key={tier.id}
              className={`bg-white rounded-2xl p-5 border relative flex flex-col justify-between transition-all select-none ${
                isActive 
                  ? 'border-indigo-650 shadow-md scale-[1.01]' 
                  : 'border-slate-150 hover:border-slate-205 shadow-3xs'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3.5 right-4 bg-gradient-to-r from-indigo-600 to-indigo-850 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Highly Recommended
                </span>
              )}

              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{tier.name}</span>
                <div className="mt-3 flex items-baseline gap-1 text-slate-800">
                  <span className="text-3xl font-black">{tier.price}</span>
                  <span className="text-xs text-slate-400 font-bold">/{tier.period}</span>
                </div>
                <p className="text-xs text-slate-405 mt-2.5 leading-normal min-h-[38px] font-semibold">{tier.desc}</p>
                
                {/* Active limitations overview */}
                <div className="mt-3.5 py-2.5 border-y border-slate-50 space-y-1 text-right">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="text-slate-400 uppercase font-black text-[9px]">Client Portals:</span>
                    <span>{tier.limits.clients}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="text-slate-400 uppercase font-black text-[9px]">Team Seats:</span>
                    <span>{tier.limits.seats}</span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="mt-4 space-y-2">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Features included:</span>
                  <div className="space-y-2">
                    {tier.features.map((feat, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-slate-650">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-semibold">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => handleTierUpdate(tier.id as any)}
                  disabled={isUpdating || isActive}
                  className={`w-full py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-black'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {isActive ? "Active Plan Selected" : `Configure ${tier.name}`}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
