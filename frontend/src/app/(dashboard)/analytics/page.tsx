"use client";

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, TrendingUp, Users, Target, MousePointer2 } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for initial load
    const mockData = [
      { date: '2026-05-01', traffic: 400, position: 22, clicks: 120 },
      { date: '2026-05-05', traffic: 600, position: 20, clicks: 180 },
      { date: '2026-05-10', traffic: 800, position: 19, clicks: 250 },
      { date: '2026-05-15', traffic: 1100, position: 18, clicks: 320 },
      { date: '2026-05-20', traffic: 1400, position: 17, clicks: 450 },
    ];
    setData(mockData);
    setLoading(false);
  }, []);

  const stats = [
    { name: 'Total Traffic', value: '12.4k', icon: Users, change: '+14.2%', trend: 'up' },
    { name: 'Avg. Position', value: '18.4', icon: Target, change: '-2.1', trend: 'down' },
    { name: 'Total Clicks', value: '3,240', icon: MousePointer2, change: '+8.1%', trend: 'up' },
    { name: 'Visibility Index', value: '0.42', icon: TrendingUp, change: '+0.05', trend: 'up' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SEO Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Track your domain's visibility and organic growth.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                <stat.icon className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-600" /> Organic Traffic
            </h3>
            <select className="text-xs font-semibold border-none bg-slate-50 rounded-md px-2 py-1 outline-none">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="traffic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 flex items-center">
              <Target className="mr-2 h-5 w-5 text-indigo-600" /> Avg. Position
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis reversed domain={['dataMin - 1', 'dataMax + 1']} hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="position" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
