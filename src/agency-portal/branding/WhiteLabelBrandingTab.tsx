import React, { useState } from "react";
import { 
  Building, 
  Palette, 
  Link, 
  Globe, 
  Mail, 
  Check, 
  Info, 
  ToggleLeft, 
  ToggleRight,
  Sparkles,
  Eye,
  Settings
} from "lucide-react";
import { Agency, AgencyBrandingConfig } from "../types";

interface WhiteLabelBrandingTabProps {
  agency: Agency;
  onUpdateBranding: (config: AgencyBrandingConfig) => Promise<void>;
}

export default function WhiteLabelBrandingTab({
  agency,
  onUpdateBranding
}: WhiteLabelBrandingTabProps) {
  const currentConfig = agency.branding_config;

  const [brandName, setBrandName] = useState(currentConfig.brandName);
  const [logoUrl, setLogoUrl] = useState(currentConfig.logoUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(currentConfig.faviconUrl || "");
  const [primaryColor, setPrimaryColor] = useState(currentConfig.primaryColor || "indigo");
  const [customDomain, setCustomDomain] = useState(currentConfig.customDomain || "");
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(currentConfig.whiteLabelEnabled);
  
  // Email sub-configuration
  const [senderName, setSenderName] = useState(currentConfig.emailBranding?.senderName || "");
  const [senderEmail, setSenderEmail] = useState(currentConfig.emailBranding?.senderEmail || "");
  const [footerText, setFooterText] = useState(currentConfig.emailBranding?.footerText || "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const config: AgencyBrandingConfig = {
        brandName,
        logoUrl: logoUrl || undefined,
        faviconUrl: faviconUrl || undefined,
        primaryColor,
        customDomain: customDomain || undefined,
        whiteLabelEnabled,
        emailBranding: {
          senderName,
          senderEmail,
          footerText
        }
      };
      
      await onUpdateBranding(config);
      setMessage("White-label branding parameters updated successfully.");
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      alert(`Branding write fault: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const colorsList = [
    { id: "emerald", label: "Mint Emerald", bg: "bg-emerald-500", text: "text-emerald-600", activeRing: "ring-emerald-500" },
    { id: "indigo", label: "Executive Indigo", bg: "bg-indigo-600", text: "text-indigo-600", activeRing: "ring-indigo-500" },
    { id: "violet", label: "Cosmic Violet", bg: "bg-violet-600", text: "text-violet-600", activeRing: "ring-violet-500" },
    { id: "sky", label: "Ocean SkyBlue", bg: "bg-sky-500", text: "text-sky-600", activeRing: "ring-sky-500" },
    { id: "rose", label: "Coral Velvet", bg: "bg-rose-500", text: "text-rose-600", activeRing: "ring-rose-500" },
    { id: "amber", label: "Solar Amber", bg: "bg-amber-500", text: "text-amber-600", activeRing: "ring-amber-500" }
  ];

  return (
    <div className="space-y-6" id="whitelabel-branding-tab">
      
      <div>
        <h2 className="text-base font-black text-slate-800 tracking-tight">White-Label Branding Suite</h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Customize client-facing layouts, report margins, header emblems, and emails using your agency's configurations.</p>
      </div>

      <form onSubmit={handleSaveBranding} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form parameters (8 cols) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-3xs space-y-6 lg:col-span-8">
          
          {/* Header Section: Enable toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50/55 rounded-xl border border-slate-100">
            <div className="space-y-0.5 max-w-md">
              <span className="text-[9px] uppercase font-black text-indigo-650 tracking-wider">White-Label Mode Access</span>
              <h3 className="text-xs font-black text-slate-800">Toggle Branded Isolation</h3>
              <p className="text-[11px] text-slate-450 font-medium">When active, all RankSyncer badges and logos vanish, exposing only your customized branding coordinates in portals and reports.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setWhiteLabelEnabled(!whiteLabelEnabled)}
              className="text-slate-800 hover:text-indigo-600 h-10 w-16 cursor-pointer focus:outline-none transition-all"
            >
              {whiteLabelEnabled ? (
                <ToggleRight className="h-10 w-16 text-indigo-650" />
              ) : (
                <ToggleLeft className="h-10 w-16 text-slate-350" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Field: Brand Name */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Corporate Brand Name</label>
              <input 
                type="text"
                required
                placeholder="e.g. Zenith Agency"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 font-bold focus:outline-indigo-500"
              />
            </div>

            {/* Field: Custom Domain */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Custom Reporting Domain</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="e.g. portal.zenithagency.com"
                  value={customDomain}
                  onChange={e => setCustomDomain(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-705 font-bold focus:outline-indigo-500"
                />
              </div>
            </div>

            {/* Field: Logo Url */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Logo Media Asset Route (URL)</label>
              <input 
                type="url"
                placeholder="https://yourserver.com/assets/logo.png"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 font-bold focus:outline-indigo-500"
              />
              <span className="text-[9px] text-slate-400 block mt-1 font-bold">Use transparent PNG file for clean header placement.</span>
            </div>

            {/* Field: Favicon Url */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Shortcut Icon Route (Favicon URL)</label>
              <input 
                type="url"
                placeholder="https://yourserver.com/assets/favicon.ico"
                value={faviconUrl}
                onChange={e => setFaviconUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 font-bold focus:outline-indigo-500"
              />
            </div>

          </div>

          {/* Color Palettes Section */}
          <div className="space-y-2">
            <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Branding Accent</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {colorsList.map(item => {
                const isActive = primaryColor === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setPrimaryColor(item.id)}
                    className={`p-2.5 border rounded-xl cursor-pointer transition-all flex items-center gap-2 text-left ${
                      isActive 
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-3xs' 
                        : 'border-slate-150 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className={`h-4.5 w-4.5 rounded-full ${item.bg} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 truncate">{item.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Customization Compartment */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-rose-50/20">
              <Mail className="h-4 w-4 text-slate-400" />
              <h4 className="text-xs font-black uppercase text-slate-800">Branded Transactional Emails</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Dispatch Sender Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Zenith Intelligence Dispatcher"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 font-bold focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Dispatch Sender Email</label>
                <input 
                  type="email"
                  placeholder="e.g. noreply@zenithagency.com"
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 font-bold focus:outline-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Custom Dispatch Email Footer Template</label>
              <textarea 
                rows={2}
                placeholder="This transmission contains highly classified marketing parameters intended exclusively for Zenith Clients."
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-705 font-bold focus:outline-indigo-500 resize-none font-sans"
              />
            </div>
          </div>

          {/* Saving Status Feed */}
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              {message}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-650 hover:bg-slate-800 text-white font-black text-xs px-6 py-3 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-indigo-500/10"
              id="btn-save-branding"
            >
              {isSaving ? "Synchronizing Assets..." : "Apply Custom Layout Settings"}
            </button>
          </div>

        </div>

        {/* Right Column: Visual Preview Card (4 cols) */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 space-y-4 lg:col-span-4 h-fit sticky top-6">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Interface Preview</span>
          </div>

          {/* Visual Device Simulator */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-150 overflow-hidden text-slate-700">
            {/* Appbar Simulation header */}
            <div className="bg-slate-900 text-slate-350 p-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img referrerPolicy="no-referrer" src={logoUrl} alt="Logo" className="h-4 w-auto max-w-28 object-contain" onError={(e) => {
                    // fallbacks
                    (e.target as any).style.display = "none";
                  }} />
                ) : (
                  <Building className="h-4 h-4 text-indigo-400" />
                )}
                <span className="text-xs font-black text-slate-100 truncate max-w-28">
                  {brandName || "My Agency"}
                </span>
                {whiteLabelEnabled ? (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[7px] font-black uppercase px-1 rounded">isolated</span>
                ) : (
                  <span className="text-[8px] text-slate-500 text-slate-300">ranksyncer co-brand</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
              </div>
            </div>

            {/* Landing page preview mockup */}
            <div className="p-4 space-y-3.5 bg-slate-50/30">
              <div className="space-y-1">
                <span className={`h-1 w-12 rounded block ${
                  primaryColor === "emerald" ? "bg-emerald-500" :
                  primaryColor === "indigo" ? "bg-indigo-600" :
                  primaryColor === "violet" ? "bg-violet-600" :
                  primaryColor === "sky" ? "bg-sky-500" :
                  primaryColor === "rose" ? "bg-rose-500" : "bg-amber-500"
                }`} />
                <h5 className="text-[13px] font-black text-slate-800">SEO Audit Summary Report</h5>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Acme Healthcare Workspace</p>
              </div>

              {/* Progress Simulation bars */}
              <div className="bg-white rounded-lg p-2.5 shadow-3xs border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-650">
                  <span>Google Visibility Indexes</span>
                  <span className={`font-mono ${
                    primaryColor === "emerald" ? "text-emerald-600" :
                    primaryColor === "indigo" ? "text-indigo-650" :
                    primaryColor === "violet" ? "text-violet-650" :
                    primaryColor === "sky" ? "text-sky-650" :
                    primaryColor === "rose" ? "text-rose-650" : "text-amber-650"
                  }`}>94%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    primaryColor === "emerald" ? "bg-emerald-500" :
                    primaryColor === "indigo" ? "bg-indigo-600" :
                    primaryColor === "violet" ? "bg-violet-600" :
                    primaryColor === "sky" ? "bg-sky-500" :
                    primaryColor === "rose" ? "bg-rose-500" : "bg-amber-500"
                  }`} style={{ width: "94%" }} />
                </div>
              </div>

              {/* Footer text previews */}
              <p className="text-[8px] text-slate-400 text-center leading-relaxed italic">
                {footerText || "Branded output generated by agency coordinates automatically."}
              </p>
            </div>
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 font-bold flex items-start gap-2 leading-relaxed">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Enable <strong>White-Label Mode Access</strong> above to trigger the live brand override, removing all core Outrank mentions from client-facing layouts.</span>
          </div>

        </div>

      </form>

    </div>
  );
}
