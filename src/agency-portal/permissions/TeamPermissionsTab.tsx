import React, { useState } from "react";
import { 
  Users, 
  Shield, 
  Plus, 
  Check, 
  User, 
  Briefcase, 
  Lock,
  Mail,
  Sliders,
  ChevronDown,
  Info
} from "lucide-react";
import { AgencyMember } from "../types";

interface TeamPermissionsTabProps {
  team: AgencyMember[];
  onAddMember: (payload: { name: string; email: string; role: string }) => Promise<void>;
  onUpdateRole: (targetUserId: string, role: string) => Promise<void>;
}

export default function TeamPermissionsTab({
  team,
  onAddMember,
  onUpdateRole
}: TeamPermissionsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("specialist");
  const [loading, setLoading] = useState(false);

  const rolesCatalog = [
    { id: "owner", title: "Agency Owner", desc: "Unrestricted master credentials across databases & subscriptions." },
    { id: "admin", title: "Agency Admin", desc: "Manage client website nodes, billing profiles, and branding setups." },
    { id: "manager", title: "Account Manager", desc: "Oversee client onboarding, dispatch documents, verify credentials." },
    { id: "specialist", title: "SEO Specialist", desc: "Run SEO audits, launch SERP crawlers, write organic structures." },
    { id: "content_manager", title: "Content Manager", desc: "Oversee Content Planners, compile optimized drafts, review edits." },
    { id: "viewer", title: "Client Viewer", desc: "Read ranking scorecards, check custom domains, download reports." }
  ];

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setLoading(true);
    try {
      await onAddMember({
        name: newName,
        email: newEmail,
        role: newRole
      });
      setNewName("");
      setNewEmail("");
      setNewRole("specialist");
      setShowAddModal(false);
      alert("Coworker enrolled successfully in White-Label workspace.");
    } catch (err: any) {
      alert(`Enrollment fault: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChangedCode = async (targetUserId: string, nextRole: string) => {
    try {
      await onUpdateRole(targetUserId, nextRole);
      alert(`Coworker permission level updated to ${nextRole}`);
    } catch (err: any) {
      alert(`Failed to update coworker role: ${err.message}`);
    }
  };

  const permissionsMatrix = [
    { module: "SEO & Keyword Reports Generator", owner: true, admin: true, manager: true, specialist: true, content_manager: false, viewer: true },
    { module: "Branded PDF Exporting & Share Links", owner: true, admin: true, manager: true, specialist: true, content_manager: true, viewer: true },
    { module: "Onboard Website Clients & Domains", owner: true, admin: true, manager: true, specialist: false, content_manager: false, viewer: false },
    { module: "Manage White-Label Accent Themes", owner: true, admin: true, manager: false, specialist: false, content_manager: false, viewer: false },
    { module: "Audit logs & Security Workspace", owner: true, admin: true, manager: false, specialist: false, content_manager: false, viewer: false },
    { module: "Agency Bills & Subscriptions Setup", owner: true, admin: false, manager: false, specialist: false, content_manager: false, viewer: false }
  ];

  return (
    <div className="space-y-6" id="team-permissions-tab">
      
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight">Team Management & Access Control</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Control agency coworker roles, configure tenant isolation, and audit permission matrices.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4.5 py-2.5 text-xs font-black rounded-xl cursor-pointer transition-all flex items-center gap-1.5 self-start"
          id="btn-add-team-member"
        >
          <Plus className="h-4.5 w-4.5" />
          Enroll Coworker Node
        </button>
      </div>

      {/* Enroll Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Onboard Workspace Crew</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="mt-4 space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Marcus Aurelius"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 font-bold focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Professional Email</label>
                <input 
                  type="email"
                  required
                  placeholder="name@zenithagency.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-750 font-semibold focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Assigned Operational Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-700 focus:outline-indigo-500 font-bold"
                >
                  <option value="admin">Agency Admin</option>
                  <option value="manager">Account Manager</option>
                  <option value="specialist">SEO Specialist</option>
                  <option value="content_manager">Content Manager</option>
                  <option value="viewer">Client Viewer</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-650 hover:bg-indigo-550 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  {loading ? "Adding..." : "Confirm Integration"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Staff list and Matrix rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coworker Roster (7 cols) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4 lg:col-span-7">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 pb-2 border-b border-on-slate-50">
            <Users className="h-4.5 w-4.5 text-indigo-500" />
            Active Agency Members
          </h3>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
            {team.map(member => (
              <div key={member.user_id} className="py-3.5 first:pt-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      {member.name}
                      {member.role === "owner" && (
                        <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase px-2 py-0.2 rounded-full">
                          Owner
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.role !== "owner" ? (
                    <select
                      value={member.role}
                      onChange={e => handleRoleChangedCode(member.user_id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 px-2 py-1 text-[11px] font-bold rounded-lg focus:outline-none cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="specialist">Specialist</option>
                      <option value="content_manager">Content Lead</option>
                      <option value="viewer">Client Viewer</option>
                    </select>
                  ) : (
                    <span className="text-[10px] text-slate-405 font-black uppercase mr-2 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <Lock className="h-3 w-3 text-indigo-500" />
                      Root Access Locked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Permission matrix (5 cols) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-indigo-500" />
              Role Permission Access Matrix
            </h3>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {permissionsMatrix.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <h4 className="text-[11px] font-black text-slate-800 tracking-tight">{item.module}</h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.owner ? 'bg-indigo-100 text-indigo-750' : 'bg-slate-200 text-slate-400 font-medium opacity-50'}`}>
                    Owner
                  </span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.admin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-400 font-medium opacity-50'}`}>
                    Admin
                  </span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.manager ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-400 font-medium opacity-50'}`}>
                    Manager
                  </span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.specialist ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-400 font-medium opacity-50'}`}>
                    Specialist
                  </span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.content_manager ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-400 font-medium opacity-50'}`}>
                    Content Lead
                  </span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.viewer ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-400 font-medium opacity-50'}`}>
                    Viewer
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-750 font-bold flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Roles are verified server-side inside API routing nodes to protect absolute isolation across corporate accounts.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
