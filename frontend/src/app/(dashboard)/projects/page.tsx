"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Globe, MoreHorizontal, Trash2, Edit2, Play, Activity } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProject, setNewProject] = useState({ domain: '', name: '', niche: '' });

  const fetchProjects = async () => {
    // In real app, fetch from /api/projects
    const mockProjects = [
      { id: '1', domain: 'https://example.com', name: 'Example Site', niche: 'Tech', crawlStatus: 'COMPLETED' },
      { id: '2', domain: 'https://saasblog.io', name: 'SaaS Insights', niche: 'Marketing', crawlStatus: 'PENDING' },
    ];
    setProjects(mockProjects);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Projects</h1>
          <p className="text-slate-500 text-sm mt-1">Manage sites and domains you are tracking.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all flex items-center shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Domain & Name</th>
                <th className="px-6 py-4">Niche</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Sync</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{project.name}</p>
                        <p className="text-xs text-slate-500">{project.domain}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-normal underline decoration-slate-300">
                    {project.niche}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      project.crawlStatus === 'COMPLETED' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                    )}>
                      {project.crawlStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-light">
                    2 hours ago
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50" title="Run Analysis">
                      <Play className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Add New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Domain URL</label>
                <input 
                  type="text" 
                  placeholder="https://yoursite.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProject.domain}
                  onChange={e => setNewProject({...newProject, domain: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input 
                  type="text" 
                  placeholder="My SaaS Blog"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-4 font-semibold">
              <button 
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-all shadow-md"
                onClick={() => setShowNewModal(false)}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
