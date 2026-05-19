"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, RefreshCw, ChevronRight } from 'lucide-react';

interface Keyword {
  id: string;
  term: string;
  volume: number;
  difficulty: number;
  intent: string;
  currentRank?: number;
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      // Assuming we have a way to get the current project ID, 
      // for now we'll fetch all or require a project selection.
      const token = localStorage.getItem('token');
      // In a real app we'd get the projectId from context or URL params
      const res = await fetch('/api/keywords?projectId=default', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setKeywords(data.keywords || []);
      }
    } catch (err) {
      console.error('Failed to fetch keywords:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const filteredKeywords = keywords.filter(k => 
    k.term.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Keyword Research</h1>
          <p className="text-slate-500 text-sm mt-1">Discover and track keywords that drive revenue.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center transition-all">
            <RefreshCw className="mr-2 h-4 w-4" /> Sync Metrics
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center shadow-sm transition-all">
            <Plus className="mr-2 h-4 w-4" /> Add Keyword
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by keyword..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all font-sans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="secondary-btn flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Keyword</th>
                <th className="px-6 py-4">Search Volume</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Intent</th>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      Searching database...
                    </div>
                  </td>
                </tr>
              ) : filteredKeywords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No keywords found for this project.
                  </td>
                </tr>
              ) : filteredKeywords.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50 transition-colors group cursor-pointer font-sans not-italic">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{k.term}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 font-mono">{k.volume.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            k.difficulty > 70 ? 'bg-red-500' : k.difficulty > 40 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${k.difficulty}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 font-mono">{k.difficulty}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                      k.intent === 'informational' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                    )}>
                      {k.intent}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-900">{k.currentRank || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center justify-end ml-auto">
                      Generate Article <ChevronRight className="ml-1 h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
