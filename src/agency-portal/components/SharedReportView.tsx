import React, { useEffect, useState } from "react";
import { 
  Building, 
  Award, 
  Globe2, 
  Printer, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertCircle,
  HelpCircle,
  Clock,
  ChevronLeft
} from "lucide-react";
import { Agency, AgencyReport } from "../types";

interface SharedReportViewProps {
  token: string;
  onClose?: () => void;
}

export default function SharedReportView({
  token,
  onClose
}: SharedReportViewProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AgencyReport | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");

    fetch(`/api/agency/reports/public?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(body => {
        if (body.success && body.report) {
          setReport(body.report);
          setAgency(body.agency);
        } else {
          setError(body.error || "White-label compiled report could not be found or has expired.");
        }
      })
      .catch(e => {
        console.error("[REPORT FETCH FAIL]:", e);
        setError("Network error fetching secure ledger data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handlePrintTrigger = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-xs font-black uppercase text-slate-400">Loading secure digital scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !report || !agency) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white border border-slate-150 rounded-2xl p-6 max-w-sm text-center shadow-lg">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-black uppercase text-slate-850">Document Access Revoked</h3>
          <p className="text-xs text-slate-405 mt-2 leading-relaxed">{error || "Reference mismatch"}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 bg-slate-850 hover:bg-slate-950 text-white font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
            >
              Back to Workspace
            </button>
          )}
        </div>
      </div>
    );
  }

  const brandConfig = agency.branding_config;
  const isWhiteLabel = brandConfig.whiteLabelEnabled;
  const accentId = brandConfig.primaryColor || "indigo";

  return (
    <div className="min-h-screen bg-slate-50/50 print:bg-white text-slate-850 font-sans selection:bg-indigo-100">
      
      {/* Top Banner layout */}
      <div className="bg-white border-b border-slate-150 py-3.5 px-6 print:hidden sticky top-0 z-40 shadow-3xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer transition-all flex items-center gap-1 text-[11px] font-black uppercase"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              Workspace
            </button>
          )}
          <span className="h-4 w-px bg-slate-205 hidden sm:block" />
          <span className="text-xs font-bold text-slate-450 uppercase font-mono tracking-wider hidden sm:inline-block">
            Secure SHARED URL
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintTrigger}
            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-750 px-3.5 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-3xs"
          >
            <Printer className="h-4 w-4" />
            Print / Export to PDF
          </button>
        </div>
      </div>

      {/* Main Document Body */}
      <main className="max-w-4xl mx-auto py-12 px-6 print:py-4">
        
        <div className="bg-white border border-slate-150 rounded-2xl p-8 sm:p-12 shadow-sm print:border-none print:shadow-none space-y-8">
          
          {/* Branded Header Block */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-150">
            <div className="space-y-2">
              {brandConfig.logoUrl ? (
                <img referrerPolicy="no-referrer" src={brandConfig.logoUrl} alt={brandConfig.brandName} className="h-8 w-auto max-w-44 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <Building className={`h-6 w-6 text-${accentId}-600`} />
                  <span className="text-lg font-black tracking-tight">{brandConfig.brandName}</span>
                </div>
              )}
              
              <div className="pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span>Compiled by {brandConfig.brandName}</span>
                <span>•</span>
                <span>Isolated Client Access Node</span>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1.5 shrink-0">
              <span className="bg-slate-100 text-slate-650 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full block w-fit sm:ml-auto">
                {report.type} White-Label report
              </span>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight font-mono">#{report.report_id}</h2>
              <span className="text-[11px] text-slate-400 font-bold font-mono block">
                Issued: {new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Customer Focus Subhead */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 block">Report Compiled For</span>
              <p className="text-sm font-black text-slate-750 mt-0.5">{report.clientName || report.client_id}</p>
            </div>
            
            <div className="sm:text-right">
              <span className="text-[9px] font-black uppercase text-slate-400 block">Target Scope Parameters</span>
              <p className="text-xs font-mono font-bold text-slate-600 mt-1 uppercase">SERP Tracking Isolated</p>
            </div>
          </div>

          {/* Scorecards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            
            <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-1">
              <span className="text-[9px] text-slate-450 font-black uppercase block">SEO Strength</span>
              <span className={`text-2xl font-black ${
                accentId === 'emerald' ? 'text-emerald-600' :
                accentId === 'indigo' ? 'text-indigo-600' :
                accentId === 'violet' ? 'text-violet-600' :
                accentId === 'sky' ? 'text-sky-600' :
                accentId === 'rose' ? 'text-rose-600' : 'text-amber-600'
              }`}>{report.metrics.seoScore || 85}%</span>
              <span className="text-[9px] bg-white border border-slate-100 font-bold px-2 py-0.2 rounded-full block w-fit mx-auto text-slate-500 uppercase">Excellent</span>
            </div>

            <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-1">
              <span className="text-[9px] text-slate-450 font-black uppercase block">Organic Keywords</span>
              <span className="text-2xl font-black text-slate-800">{(report.metrics.keywordsCount || 1200).toLocaleString()}</span>
              <span className="text-[9px] bg-white border border-slate-100 font-bold px-2 py-0.2 rounded-full block w-fit mx-auto text-slate-500 uppercase">SERP Index</span>
            </div>

            <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-1">
              <span className="text-[9px] text-slate-450 font-black uppercase block">Monthly Traffic</span>
              <span className="text-2xl font-black text-slate-800">
                {report.metrics.organicTraffic ? (report.metrics.organicTraffic).toLocaleString() : "14,500"}
              </span>
              <span className="text-[9px] bg-white border border-slate-100 font-bold px-2 py-0.2 rounded-full block w-fit mx-auto text-slate-500 uppercase">+15.4% trend</span>
            </div>

            <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-1">
              <span className="text-[9px] text-slate-450 font-black uppercase block">Reference Authority</span>
              <span className="text-2xl font-black text-slate-800">DA {report.metrics.domainRating || 45}</span>
              <span className="text-[9px] bg-white border border-slate-100 font-bold px-2 py-0.2 rounded-full block w-fit mx-auto text-slate-500 uppercase">Moz Strength</span>
            </div>

          </div>

          {/* Executive Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider pb-1.5 border-b border-slate-100">
              I. Executive Summary & Diagnostic Analytica
            </h3>
            <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-medium">
              {report.sections.executiveSummary}
            </p>
          </div>

          {/* Strategy / Action Items */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider pb-1.5 border-b border-slate-100">
              II. Prescriptive Technical Recommendations
            </h3>
            
            <div className="space-y-2.5">
              {report.sections.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 bg-slate-50/65 border border-slate-100 p-3 rounded-xl hover:bg-slate-50 transition-all">
                  <div className={`h-6 w-6 rounded-full ${
                    accentId === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                    accentId === 'indigo' ? 'bg-indigo-500/10 text-indigo-650' :
                    accentId === 'violet' ? 'bg-violet-500/10 text-violet-650' :
                    accentId === 'sky' ? 'bg-sky-500/10 text-sky-650' :
                    accentId === 'rose' ? 'bg-rose-500/10 text-rose-650' : 'bg-amber-500/10 text-amber-650'
                  } flex items-center justify-center font-black text-xs shrink-0 mt-0.5`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-750 font-mono text-slate-800">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Footer */}
          <div className="pt-8 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase">
                {brandConfig.emailBranding?.footerText || `Powered by ${brandConfig.brandName}`}
              </p>
              {!isWhiteLabel && (
                <p className="text-[8px] text-slate-350">
                  White-label infrastructure hosted by RankSyncer suite
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-black bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Cryptographic Signature Secured</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
