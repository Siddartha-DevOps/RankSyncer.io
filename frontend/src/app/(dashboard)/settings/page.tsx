"use client";

import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, CreditCard, Bell, Globe, Check, Link as LinkIcon, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Integrations');
  const [cmsData, setCmsData] = useState({
    cmsType: 'WORDPRESS',
    siteUrl: '',
    apiKey: '',
  });
  const [status, setStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

  const sections = [
    { name: 'General', icon: SettingsIcon, desc: 'Update your personal info and email preferences.' },
    { name: 'Subscription', icon: CreditCard, desc: 'Manage your plan and billing history.' },
    { name: 'Integrations', icon: Globe, desc: 'Connect WordPress, Shopify, or Ghost site.' },
    { name: 'Security', icon: Shield, desc: 'Update password and login methods.' },
  ];

  const handleCmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('SAVING');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cms/integrate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...cmsData, projectId: 'default_placeholder' }), // In real app, actual ID
      });
      if (res.ok) {
        setStatus('SUCCESS');
        setTimeout(() => setStatus('IDLE'), 3000);
      } else {
        setStatus('ERROR');
      }
    } catch (err) {
      setStatus('ERROR');
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and site connections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {sections.map(s => (
          <button 
            key={s.name} 
            onClick={() => setActiveTab(s.name)}
            className={cn(
              "flex flex-col items-center p-4 rounded-xl border transition-all text-center group",
              activeTab === s.name 
                ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" 
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <s.icon className={cn("h-5 w-5 mb-2", activeTab === s.name ? "text-blue-600" : "text-slate-400")} />
            <span className="text-xs font-bold uppercase tracking-wider">{s.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'Integrations' ? (
          <div className="p-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Globe className="mr-2 h-5 w-5 text-blue-600" /> CMS Integrations
            </h3>
            <p className="text-sm text-slate-500 mt-1 mb-8">Automatically publish your articles to your CMS of choice.</p>

            <form onSubmit={handleCmsSubmit} className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">CMS Platform</label>
                <div className="grid grid-cols-2 gap-3">
                  {['WORDPRESS', 'GHOST', 'SHOPIFY', 'WEBHOOK'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCmsData({...cmsData, cmsType: type})}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg border transition-all",
                        cmsData.cmsType === type 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Site URL</label>
                <input 
                  type="url" 
                  placeholder="https://yourblog.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={cmsData.siteUrl}
                  onChange={e => setCmsData({...cmsData, siteUrl: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">API Key / Application Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                  value={cmsData.apiKey}
                  onChange={e => setCmsData({...cmsData, apiKey: e.target.value})}
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={status === 'SAVING'}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {status === 'SAVING' ? 'Verifying Connection...' : status === 'SUCCESS' ? 'Connected!' : 'Connect CMS'}
                  {status === 'SUCCESS' && <Check className="ml-2 h-5 w-5" />}
                  {status === 'ERROR' && <AlertCircle className="ml-2 h-5 w-5" />}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>This section is under construction.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
