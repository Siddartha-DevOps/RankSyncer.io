"use client";

import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';

interface ContentPlan {
  id: string;
  name: string;
  status: string;
  articles: { id: string; title: string; status: string }[];
  createdAt: string;
}

export default function ContentPlannerPage() {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/content-plans?projectId=default', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Planner</h1>
          <p className="text-slate-500 text-sm mt-1">Strategic topic clusters and publishing schedules.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 mr-2">
            <button 
              onClick={() => setView('grid')}
              className={cn("p-1.5 rounded-md transition-all", view === 'grid' ? "bg-slate-100 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-1.5 rounded-md transition-all", view === 'list' ? "bg-slate-100 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center shadow-sm transition-all">
            <Plus className="mr-2 h-4 w-4" /> New Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading your content strategy...</div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
            <CalendarDays className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No content plans yet</h3>
          <p className="text-slate-500 max-w-sm mt-2 mb-8">Let the AI analyze your keyword gaps and generate a 30-day topical cluster strategy for your niche.</p>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center">
            Generate AI Content Strategy <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className={cn(
          "grid gap-6",
          view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {plans.map(plan => (
            <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">Strategy</span>
                <span className="text-xs text-slate-400">{new Date(plan.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{plan.name || 'Untitled Plan'}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">A topical cluster aimed at establishing authority in your niche.</p>
              
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {i}
                    </div>
                  ))}
                  <div className="h-8 w-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                    +{plan.articles.length}
                  </div>
                </div>
                <button className="text-xs font-bold text-slate-400 hover:text-blue-600 underline">View Full Calendar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-bold mb-2">Automate Your Publishing</h3>
          <p className="text-blue-100 mb-6">Connect your CMS to sync the content planner directly to your blog's editorial calendar. One-click publishing, fully autonomous.</p>
          <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-sm">
            Setup CMS Integration
          </button>
        </div>
        <CalendarDays className="absolute -right-4 -bottom-4 h-48 w-48 text-white/10 rotate-12" />
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
