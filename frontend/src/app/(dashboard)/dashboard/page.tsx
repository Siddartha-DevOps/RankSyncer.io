"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  FileCheck, 
  ArrowRight,
  ExternalLink,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  domain: string;
  name: string;
  _count: {
    keywords: number;
    articles: number;
    backlinks: number;
  };
  analytics: Array<{
    visibilityIndex: number;
    avgPosition: number;
    totalKeywords: number;
    top3Count: number;
    top10Count: number;
    organicTraffic: number;
    date: string;
  }>;
  lastCrawledAt: string | null;
  crawlStatus: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/login';
            return;
          }
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Calculate aggregate stats
  const totalOrganicTraffic = projects.reduce((acc, p) => acc + (p.analytics[0]?.organicTraffic || 0), 0);
  const avgPosition = projects.length > 0 
    ? (projects.reduce((acc, p) => acc + (p.analytics[0]?.avgPosition || 30), 0) / projects.length).toFixed(1)
    : '0';
  const totalKeywordsInTop10 = projects.reduce((acc, p) => acc + (p.analytics[0]?.top10Count || 0), 0);
  const totalArticles = projects.reduce((acc, p) => acc + p._count.articles, 0);

  const stats = [
    { name: 'Avg. Position', value: avgPosition, change: projects.length > 0 ? '+2.1' : '0', status: 'up' },
    { name: 'Organic Traffic', value: totalOrganicTraffic.toLocaleString(), change: projects.length > 0 ? '+12%' : '0', status: 'up' },
    { name: 'KW in Top 10', value: totalKeywordsInTop10.toString(), change: projects.length > 0 ? '+5' : '0', status: 'up' },
    { name: 'Total Articles', value: totalArticles.toString(), change: '8 pending', status: 'neutral' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-slate-500 font-medium">Syncing your SEO data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-8 rounded-2xl flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-red-900">Database Connection Error</h3>
        <p className="text-red-700 mt-2 max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 id="dashboard-title" className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor your SEO performance across {projects.length} project{projects.length !== 1 ? 's' : ''}.</p>
        </div>
        <Link 
          href="/projects/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all flex items-center shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">{stat.name}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                stat.status === 'up' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Active Projects</h3>
              <Link href="/projects" className="text-sm text-blue-600 hover:underline font-medium">View all</Link>
            </div>
            
            {projects.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="h-6 w-6 text-slate-400" />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">No projects added yet</h4>
                <p className="text-slate-500 mt-1 mb-6">Connect your first domain to start autonomous content generation.</p>
                <Link href="/projects/new" className="inline-flex items-center text-blue-600 font-bold hover:underline">
                  Add your first project <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <Link 
                    href={`/projects/${project.id}`} 
                    key={project.id} 
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{project.domain}</p>
                        <p className="text-xs text-slate-500">
                          {project.crawlStatus === 'COMPLETED' 
                            ? `Last synchronized ${project.lastCrawledAt ? new Date(project.lastCrawledAt).toLocaleDateString() : 'recently'}`
                            : `Status: ${project.crawlStatus}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900">{project._count.keywords} Keywords</p>
                        <p className="text-xs text-slate-500">{project._count.articles} articles generated</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 animate-pulse-slow">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-semibold text-slate-900">Global Visibility Trends</h3>
               <TrendingUp className="h-5 w-5 text-green-500" />
             </div>
             <div className="h-64 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 p-8 text-center">
                <Search className="h-10 w-10 mb-4 opacity-20" />
                <p className="text-sm">Aggregated visibility charts will appear here as soon as more projects are analyzed.</p>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Task Queue</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live</span>
            </div>
            <div className="p-4 space-y-4">
              {projects.some(p => p.crawlStatus === 'PENDING') ? (
                <div className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                   <div className="h-2 w-2 rounded-full bg-blue-600 animate-ping mr-3" />
                   <div className="flex-1">
                     <p className="text-xs font-bold text-blue-900 uppercase">Analysis in progress</p>
                     <p className="text-[10px] text-blue-700">Crawling keyword gaps...</p>
                   </div>
                </div>
              ) : null}
              {[
                { title: 'Semantic SEO analysis of "best ai tools"', status: 'Ready' },
                { title: 'Generating article for "productivity hacks 2024"', status: 'Ready' },
                { title: 'Syncing backlinks for domain.com', status: 'Completed' }
              ].map((task, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 cursor-pointer">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate tracking-tight">{task.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{task.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <h4 className="font-bold text-lg mb-2">Autonomous Mode</h4>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">Let RankSyncer handle everything. Enable full autonomy to generate, optimize, and publish content automatically.</p>
            <button className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/20">
              Enable Full Autonomy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fixed missing icon in imports
function FolderKanban(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <path d="M8 10v4" />
      <path d="M12 10v2" />
      <path d="M16 10v6" />
    </svg>
  );
}

