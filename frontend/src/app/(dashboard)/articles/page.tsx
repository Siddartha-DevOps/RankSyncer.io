"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Plus, ExternalLink, Globe, Clock, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  status: 'DRAFT' | 'GENERATING' | 'READY' | 'PUBLISHED' | 'FAILED';
  slug: string;
  createdAt: string;
  publishedUrl?: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/articles?projectId=default', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleGenerate = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/articles/${id}/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchArticles(); // Refresh list
      }
    } catch (err) {
      console.error('Failed to trigger generation:', err);
    }
  };

  const statusMap = {
    DRAFT: { color: 'text-slate-500 bg-slate-50', icon: Clock },
    GENERATING: { color: 'text-blue-600 bg-blue-50 animate-pulse', icon: Play },
    READY: { color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
    PUBLISHED: { color: 'text-blue-700 bg-blue-100', icon: Globe },
    FAILED: { color: 'text-red-600 bg-red-50', icon: AlertCircle },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content & Articles</h1>
          <p className="text-slate-500 text-sm mt-1">High-quality, SEO-optimized content ready for your blog.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center shadow-sm transition-all">
          <Plus className="mr-2 h-4 w-4" /> New Article
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Article Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading articles...</td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-slate-200 mb-4" />
                      <p className="text-slate-500">No articles generated yet.</p>
                    </div>
                  </td>
                </tr>
              ) : articles.map((article) => {
                const StatusIcon = statusMap[article.status].icon;
                return (
                  <tr key={article.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{article.title}</span>
                        <span className="text-xs text-slate-500 mt-0.5">/{article.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        statusMap[article.status].color
                      )}>
                        <StatusIcon className="mr-1.5 h-3 w-3" />
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {article.status === 'DRAFT' && (
                          <button 
                            onClick={() => handleGenerate(article.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Generate Content"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {article.status === 'READY' && (
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors" title="Edit">
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {(article.status === 'READY' || article.status === 'PUBLISHED') && (
                          <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors" title="View">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
