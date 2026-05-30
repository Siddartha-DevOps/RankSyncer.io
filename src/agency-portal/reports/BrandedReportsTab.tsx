import React, { useState } from "react";
import { 
  Building, 
  FileText, 
  Plus, 
  Trash2, 
  Copy, 
  Link2, 
  Download, 
  Printer, 
  Check, 
  Sparkles,
  AlertCircle,
  Clock,
  Eye,
  Award
} from "lucide-react";
import { AgencyClient, AgencyReport, AgencyMember } from "../types";

interface BrandedReportsTabProps {
  clients: AgencyClient[];
  reports: AgencyReport[];
  team: AgencyMember[];
  onGenerateReport: (payload: { clientId: string; title: string; type: string; summary: string; recommendations: string[] }) => Promise<void>;
  onDeleteReport: (reportId: string) => Promise<void>;
}

export default function BrandedReportsTab({
  clients,
  reports,
  onGenerateReport,
  onDeleteReport
}: BrandedReportsTabProps) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.client_id || "");
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("seo");
  
  // Sections configuration
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [currentRecommendation, setCurrentRecommendation] = useState("");
  const [recommendationsList, setRecommendationsList] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeClients = clients.filter(c => c.status === "active");

  const handleAddRecommendation = () => {
    if (!currentRecommendation.trim()) return;
    setRecommendationsList(prev => [...prev, currentRecommendation.trim()]);
    setCurrentRecommendation("");
  };

  const handleRemoveRecommendation = (idx: number) => {
    setRecommendationsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("Please select a target client relative to this workspace.");
      return;
    }
    if (!reportTitle.trim()) {
      alert("Please specify a report title.");
      return;
    }
    setLoading(true);
    try {
      await onGenerateReport({
        clientId: selectedClientId,
        title: reportTitle,
        type: reportType,
        summary: executiveSummary || "Performance analytics parameters reflect a healthy upward projection in search velocity.",
        recommendations: recommendationsList.length > 0 ? recommendationsList : ["Audit high-priority meta-description structures."]
      });
      
      // Clear reporting state
      setReportTitle("");
      setExecutiveSummary("");
      setRecommendationsList([]);
      alert("White-label report synthesized successfully!");
    } catch (err: any) {
      alert(`Report compilation failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (token: string, reportId: string) => {
    const publicUrl = `${window.location.origin}/share-report?token=${token}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedId(reportId);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      alert("Could not copy secure token URL to clipboard.");
    }
  };

  const handlePrintReportExternal = (token: string) => {
    const publicUrl = `${window.location.origin}/share-report?token=${token}&print=true`;
    window.open(publicUrl, "_blank");
  };

  return (
    <div className="space-y-6" id="branded-reports-tab">
      
      <div>
        <h2 className="text-base font-black text-slate-800 tracking-tight">Branded PDF Report Builder</h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Synthesize executive summary reports, organic rankings scorecards, and keyword acquisition graphs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Report Builder (5 cols) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4 lg:col-span-5 h-fit">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 pb-2 border-b border-slate-50">
            <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
            Report Synthesis Controls
          </h3>

          {activeClients.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold uppercase">No Active Clients Onboarded</p>
              <p className="text-[10px] text-slate-400 mt-1">Please register an active client before generating reports.</p>
            </div>
          ) : (
            <form onSubmit={handleGenerateReportSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Target Website Client</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-700 focus:outline-indigo-500 font-bold"
                >
                  {activeClients.map(c => (
                    <option key={c.client_id} value={c.client_id}>
                      {c.name} ({c.websites[0] || "No domain linked"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Report Parameters Theme</label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-700 focus:outline-indigo-500 font-bold"
                  >
                    <option value="seo">SEO Audit Index</option>
                    <option value="ranking">SERP Keywords Rank</option>
                    <option value="backlink">Backlink Network Track</option>
                    <option value="content">Content Yield Report</option>
                    <option value="growth">Composite Traffic Growth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Document Title Header</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Q2 Performance Log"
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-705 font-bold focus:outline-indigo-500"
                  />
                </div>

              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Expert Executive Summary</label>
                <textarea 
                  rows={3}
                  placeholder="Summarize keyword velocity milestones and immediate SEO technical bottleneck diagnostics for this client node..."
                  value={executiveSummary}
                  onChange={e => setExecutiveSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-705 font-bold focus:outline-indigo-500 resize-none"
                />
              </div>

              {/* Action Recommendation Inputs List */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Dynamic SEO Opportunity Blocks</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. Compress category product thumbnails"
                    value={currentRecommendation}
                    onChange={e => setCurrentRecommendation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-705 font-semibold focus:outline-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecommendation}
                    className="bg-slate-850 hover:bg-slate-950 text-white min-h-[38px] px-3 rounded-xl text-xs font-black uppercase cursor-pointer shrink-0 transition-all"
                  >
                    Add
                  </button>
                </div>

                {recommendationsList.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 divide-y divide-slate-105 max-h-36 overflow-y-auto space-y-1">
                    {recommendationsList.map((rec, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 first:pt-0">
                        <span className="text-[11px] font-semibold text-slate-650 truncate max-w-[80%]">{rec}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecommendation(idx)}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-black uppercase cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-5 py-3 rounded-xl cursor-pointer w-full transition-all shadow-md hover:shadow-indigo-500/10"
                >
                  {loading ? "Compiling Branded Layout..." : "Synthesize White-Label Report"}
                </button>
              </div>

            </form>
          )}
        </div>

        {/* Right Column: Existing reports list / table (7 cols) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4 lg:col-span-7">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 pb-2 border-b border-slate-50">
            <FileText className="h-4.5 w-4.5 text-indigo-500" />
            Compiled Branded PDF Catalogs
          </h3>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="h-10 w-10 mx-auto text-slate-205 mb-2" />
                <p className="text-xs font-black uppercase text-slate-505">No reports compiled yet</p>
                <p className="text-[10px] text-slate-400 mt-1">Generated metrics are saved safely under secure UUID tags.</p>
              </div>
            ) : (
              reports.map(report => (
                <div 
                  key={report.report_id}
                  className="bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 border border-slate-150 rounded-xl p-4.5 transition-all text-slate-800 relative space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-650 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                          {report.type} report
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 font-semibold">
                          <Clock className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-black tracking-tight mt-1.5 text-slate-800">
                        {report.title}
                      </h4>
                      <p className="text-[10px] text-slate-405 font-black uppercase mt-0.5">
                        Client: {report.clientName || report.client_id}
                      </p>
                    </div>

                    <div className="flex gap-1.5 self-start shrink-0">
                      
                      {/* Copy Secure Share Token Link */}
                      <button
                        onClick={() => handleCopyLink(report.shareable_token, report.report_id)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-center ${
                          copiedId === report.report_id
                            ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900'
                        }`}
                        title="Copy secure white-label share link"
                      >
                        {copiedId === report.report_id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Link2 className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Print PDF Preview */}
                      <button
                        onClick={() => handlePrintReportExternal(report.shareable_token)}
                        className="p-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                        title="Print Branded Report / Export to PDF"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete index catalog */}
                      <button
                        onClick={() => onDeleteReport(report.report_id)}
                        className="p-2 bg-white border border-slate-200 hover:border-indigo-150 text-rose-500 hover:bg-rose-50/50 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                        title="Delete report index"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                    </div>
                  </div>

                  {/* Micro stats indicators */}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center select-none">
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <span className="text-[8px] text-slate-400 block tracking-tight font-black uppercase">SEO Rank</span>
                      <span className="text-[11px] font-black text-slate-800">{report.metrics.seoScore}%</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <span className="text-[8px] text-slate-400 block tracking-tight font-black uppercase">Keywords</span>
                      <span className="text-[11px] font-black text-slate-800">{report.metrics.keywordsCount}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <span className="text-[8px] text-slate-400 block tracking-tight font-black uppercase">Mo. Traffic</span>
                      <span className="text-[11px] font-black text-slate-800">
                        {report.metrics.organicTraffic ? (report.metrics.organicTraffic / 1000).toFixed(1) + "k" : "14k"}
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-100">
                      <span className="text-[8px] text-slate-400 block tracking-tight font-black uppercase">Authority</span>
                      <span className="text-[11px] font-black text-slate-800">DA {report.metrics.domainRating || 45}</span>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
