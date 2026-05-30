import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Mail, 
  Clock, 
  Plus, 
  CheckCircle, 
  X, 
  RefreshCw, 
  Sliders, 
  Building, 
  Activity, 
  Info,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrgDetail {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  billingPlan: string;
}

interface Member {
  organizationId: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
  lastActive: string;
}

interface Invite {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedBy: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  organizationId: string;
  action: string;
  actor: string;
  details: string;
  createdAt: string;
}

interface TeamCollaborationProps {
  userId: string;
  userEmail: string;
  activePlan: string; // "Starter" | "Growth" | "Agency"
}

export default function TeamCollaborationDashboard({ userId, userEmail, activePlan }: TeamCollaborationProps) {
  // Team administration state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [currentUserRole, setCurrentUserRole] = useState<string>('Owner');
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);

  // Modal / Inputs state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');
  const [inviting, setInviting] = useState(false);

  // New Organization setup (for users that don't have one)
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Transfer Ownership confirming
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Permission toggles in progress
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null);

  // Load team data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/team/organization?userId=${userId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch team configuration');
      }
      const data = await res.json();
      
      if (data.success && data.hasOrg) {
        setOrg(data.organization);
        setMembers(data.members || []);
        setInvites(data.invites || []);
        setPermissions(data.permissions || {});
        setCurrentUserRole(data.currentUserRole || 'Owner');
      } else {
        setOrg(null);
        setMembers([]);
        setInvites([]);
      }

      // Fetch logs
      const logRes = await fetch(`/api/team/activity-logs?userId=${userId}`);
      if (logRes.ok) {
        const logData = await logRes.json();
        if (logData.success) {
          setActivityLogs(logData.logs || []);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed loading team collaboration center.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // Handle invitation submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    if (!inviteEmail.includes('@')) {
      setError('Please specify a valid email address');
      return;
    }

    try {
      setInviting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/team/members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orgId: org.id,
          email: inviteEmail.trim(),
          role: inviteRole,
          invitedBy: userId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit invitation');
      }

      setSuccess(`Successfully invited ${inviteEmail} as ${inviteRole}!`);
      setShowInviteModal(false);
      setInviteEmail('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  // Create Organization structure
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName) return;

    try {
      setCreatingOrg(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/team/organization/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          name: newOrgName,
          billingPlan: activePlan + " Plan"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create workspace organization.');
      }

      setSuccess(`Organization "${newOrgName}" created successfully!`);
      setShowCreateOrgModal(false);
      setNewOrgName('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingOrg(false);
    }
  };

  // Cancel Invite action
  const cancelInvite = async (inviteId: string) => {
    try {
      setError(null);
      const res = await fetch('/api/team/invites/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, userId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message || 'Invitation cancelled.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Resend Invite action
  const resendInvite = async (inviteId: string) => {
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch('/api/team/invites/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, userId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message || 'Invitation resent successfully.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Simulate Accepting Invite (Amazing sandbox trigger)
  const simulateAcceptInvite = async (inviteId: string, email: string) => {
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch('/api/team/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Demo simulation: ${email} accepted the invitation & successfully joined!`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Change Role action
  const updateMemberRole = async (targetUserId: string, newRole: string) => {
    if (!org) return;
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch('/api/team/members/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: org.id,
          targetUserId,
          newRole,
          userId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message || 'Role adjusted updated successfully.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Transfer Ownership action
  const transferOwnership = async (targetUserId: string) => {
    if (!org) return;
    try {
      setTransferring(true);
      setError(null);
      setSuccess(null);
      const res = await fetch('/api/team/ownership/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: org.id,
          targetUserId,
          userId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message || 'Ownership transferred!');
      setTransferTargetId(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTransferring(false);
    }
  };

  // Remove Member action
  const removeMember = async (targetUserId: string) => {
    if (!org) return;
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch('/api/team/members/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: org.id,
          targetUserId,
          userId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message || 'Member terminated.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Update specific permission check
  const togglePermissionKey = async (role: string, permissionKey: string, currentValue: boolean) => {
    if (!org) return;
    const progressId = `${role}-${permissionKey}`;
    try {
      setUpdatingPermission(progressId);
      setError(null);
      
      const res = await fetch('/api/team/permissions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          orgId: org.id,
          role,
          permissionKey,
          value: !currentValue
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Permissions matrix for "${role}" customized!`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingPermission(null);
    }
  };

  // Helper roles
  const rolesList = ['Admin', 'Editor', 'SEO Manager', 'Viewer', 'Client'];
  const permissionKeys = [
    { id: 'content_planner', label: 'Planner Queue' },
    { id: 'ai_writer', label: 'AI Code Writer' },
    { id: 'keywords', label: 'KW Research' },
    { id: 'seo_audit', label: 'Site SEO Audits' },
    { id: 'integrations', label: 'CMS Connected Hub' },
    { id: 'publishing', label: 'Publish Triggers' },
    { id: 'billing', label: 'Billing Center' },
    { id: 'analytics', label: 'Metrics Charts' },
    { id: 'team_management', label: 'Team Setup' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Synchronizing global multi-tenant organization nodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Alert System banner notifications */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-50 border border-rose-200/60 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-extrabold text-[10px]">✕</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">✕</button>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {!org ? (
        // NO ACTIVE WORKSPACE STATE
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center max-w-xl mx-auto space-y-6 py-12">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
            <Building className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800 tracking-tight font-sans">Establish Your SEO Organization</h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-md">
              Create a multi-user workspace to connect other content creators, clients, and developers. Easily collaborate across SEO queues, publishing calendars, and audit pipelines with complete organization tracking logs.
            </p>
          </div>
          <button
            onClick={() => setShowCreateOrgModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-600/15 cursor-pointer flex items-center gap-2 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" /> Initialize Workspace Organization
          </button>
        </div>
      ) : (
        // COMPREHENSIVE TEAM DASHBOARD
        <div className="space-y-8">
          
          {/* Header org details bar */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="space-y-1.5 z-10">
              <span className="text-[10px] font-black uppercase text-indigo-400 font-mono tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                Active Relational Workspace Node
              </span>
              <h3 className="text-xl font-black tracking-tight">{org.name}</h3>
              <p className="text-xs text-slate-400 leading-none">
                Workspace Tenant ID: <span className="font-mono text-[10px] bg-slate-800 select-all p-1 rounded text-slate-300 border border-slate-700/60 leading-none">{org.id}</span>
                <span className="mx-2 font-black text-slate-600">•</span>
                Billing: <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-500/15 font-black text-[9px] px-2 py-0.5 rounded tracking-wide font-sans">{org.billingPlan}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 z-10">
              <div className="bg-slate-800/80 px-3.5 py-2.5 rounded-2xl border border-slate-700 text-left">
                <p className="text-[10px] text-slate-450 font-bold uppercase leading-none">Total Seats Used</p>
                <p className="text-base font-black text-white mt-1 leading-none">
                  {members.length + invites.filter(i => i.status === 'pending').length}
                  <span className="text-slate-400 font-normal text-xs">
                    {org.billingPlan.startsWith("Starter") ? " / 1" : org.billingPlan.startsWith("Growth") ? " / 5" : " / Unlimited"}
                  </span>
                </p>
              </div>

              {currentUserRole === 'Owner' || currentUserRole === 'Admin' ? (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-550 hover:from-indigo-550 hover:to-indigo-500 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-600/30 font-sans tracking-wide active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-500"
                >
                  <UserPlus className="h-4 w-4" /> Invite Member
                </button>
              ) : null}
            </div>
          </div>

          {/* ACTIVE ASSIGNED TEAM MEMBERS TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">Workspace Team Members</h4>
                  <p className="text-slate-400 text-[11px] leading-tight mt-0.5">Control active roles, transfer organizational ownership, or remove user permissions.</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 text-xs bg-slate-100 text-slate-650 font-black rounded-lg">
                {members.length} Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-450 font-mono">
                    <th className="py-4.5 px-6">Member Profile</th>
                    <th className="py-4.5 px-3">Email Address</th>
                    <th className="py-4.5 px-3 select-none">Role Privilege</th>
                    <th className="py-4.5 px-3">Last Active</th>
                    <th className="py-4.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 divide-dashed text-slate-700 text-xs font-medium">
                  {members.map(member => {
                    const isSelf = member.userId === userId;
                    return (
                      <tr key={member.userId} className="hover:bg-slate-50/20 transition-colors">
                        <td className="py-4.5 px-6 flex items-center gap-3">
                          <div className="h-8.5 w-8.5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-150 text-indigo-700 text-xs font-black rounded-xl flex items-center justify-center shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              {member.name}
                              {isSelf && (
                                <span className="bg-indigo-50 text-indigo-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-indigo-100">You</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="py-4.5 px-3 font-mono text-slate-500 font-semibold text-[11px]">{member.email}</td>
                        <td className="py-4.5 px-3">
                          {isSelf || currentUserRole === 'Viewer' || currentUserRole === 'Client' || currentUserRole === 'Editor' || currentUserRole === 'SEO Manager' ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                              member.role === 'Owner' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                              member.role === 'Admin' ? 'bg-sky-50 text-sky-800 border border-sky-100' :
                              member.role === 'Editor' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                              member.role === 'SEO Manager' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                              'bg-slate-100 text-slate-750'
                            }`}>
                              <Shield className="h-3 w-3" />
                              {member.role}
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) => updateMemberRole(member.userId, e.target.value)}
                              disabled={member.role === 'Owner' && currentUserRole !== 'Owner'}
                              className="bg-white border border-slate-200 rounded-lg text-[11px] font-black py-1 px-2 text-slate-750 focus:ring-1 focus:ring-indigo-500 outline-none p-1 shrink-0 select"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Editor">Editor</option>
                              <option value="SEO Manager">SEO Manager</option>
                              <option value="Viewer">Viewer</option>
                              <option value="Client">Client</option>
                            </select>
                          )}
                        </td>
                        <td className="py-4.5 px-3 text-[10px] text-slate-450 font-mono font-bold flex items-center gap-1 mt-2.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {new Date(member.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(member.lastActive).toLocaleDateString()})
                        </td>
                        <td className="py-4.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {currentUserRole === 'Owner' && member.role === 'Admin' && (
                              <button
                                onClick={() => setTransferTargetId(member.userId)}
                                className="text-[10px] bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white px-2 py-1 rounded font-black border border-amber-500/25 cursor-pointer leading-tight"
                              >
                                Transfer Owner &rarr;
                              </button>
                            )}
                            
                            {!isSelf && (currentUserRole === 'Owner' || (currentUserRole === 'Admin' && member.role !== 'Admin' && member.role !== 'Owner')) ? (
                              <button
                                onClick={() => {
                                  if (confirm(`Are you certain you want to remove ${member.name} from the organization workspace? This is irreversible.`)) {
                                    removeMember(member.userId);
                                  }
                                }}
                                className="p-1 px-2.5 bg-rose-50/50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-black border border-rose-100 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Terminate
                              </button>
                            ) : (
                              <span className="text-slate-350 text-[10px] italic font-normal mr-2">No actions available</span>
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

          {/* ACTIVE OUTSTANDING PENDING INVITATIONS ROW */}
          {invites.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">Pending Invitation Requests</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">Invitation notifications already dispatched and waiting signature entry verification.</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-150/50">
                {invites.map(invite => (
                  <div key={invite.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/10">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-850 flex items-center gap-2">
                        {invite.email}
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          Pending: {invite.role}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Invited by {invite.invitedBy} on {new Date(invite.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Sim Accept Button */}
                      <button
                        onClick={() => simulateAcceptInvite(invite.id, invite.email)}
                        className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-black border border-indigo-200 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="Simulate this invitee accepting the invitation"
                      >
                        <Sparkles className="h-3 w-3" /> [Simulate Invite Accept]
                      </button>

                      {(currentUserRole === 'Owner' || currentUserRole === 'Admin') && (
                        <>
                          <button
                            onClick={() => resendInvite(invite.id)}
                            className="px-2.5 py-1.5 bg-slate-50 text-slate-650 hover:bg-slate-200 rounded-lg text-[10px] font-black border border-slate-205 cursor-pointer"
                          >
                            Resend Email
                          </button>
                          <button
                            onClick={() => cancelInvite(invite.id)}
                            className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-black border border-rose-100 cursor-pointer"
                          >
                            Cancel Request
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPLEX MATRIX: ROLE-BASED ACCESS & DYNAMIC PERMISSIONS SYSTEM */}
          <div className="bg-white rounded-3xl border border-slate-200/85 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Sliders className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 leading-tight">Role-Based Permission Matrix</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Customize access maps per role group. {currentUserRole === 'Owner' ? 'Toggle permission parameters to immediately lock interface modules.' : 'Read-only access matrix for current user.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-450 font-mono">
                    <th className="py-4 px-6">System Module Key</th>
                    {rolesList.map(role => (
                      <th key={role} className="py-4 px-3 text-center">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                  {permissionKeys.map(perm => (
                    <tr key={perm.id} className="hover:bg-slate-50/15">
                      <td className="py-4 px-6 font-extrabold text-slate-900">
                        {perm.label}
                        <span className="block text-[10px] text-slate-400 font-mono uppercase mt-0.5 font-normal">key: {perm.id}</span>
                      </td>
                      {rolesList.map(role => {
                        const hasPerm = permissions[role]?.[perm.id] ?? false;
                        const isUpdating = updatingPermission === `${role}-${perm.id}`;
                        const canToggle = currentUserRole === 'Owner';
                        
                        return (
                          <td key={role} className="py-4 px-3 text-center select-none">
                            <button
                              disabled={!canToggle || isUpdating}
                              onClick={() => togglePermissionKey(role, perm.id, hasPerm)}
                              className={`mx-auto h-5.5 w-11 rounded-full p-0.5 transition-colors cursor-pointer relative items-center flex ${
                                isUpdating ? 'bg-slate-300 pointer-events-none' :
                                hasPerm ? 'bg-indigo-600' : 'bg-slate-200'
                              } ${!canToggle && 'opacity-65 cursor-not-allowed'}`}
                            >
                              <div 
                                className={`h-4.5 w-4.5 rounded-full bg-white transition-all shadow-xs shrink-0 ${
                                  hasPerm ? 'translate-x-5.5' : 'translate-x-0'
                                }`} 
                              />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] leading-relaxed text-slate-450 font-semibold flex items-center gap-1.5">
              <Info className="h-4 w-4 text-slate-450 mt-0.5 shrink-0" />
              <span>
                <strong>Workspace Owner Note:</strong> Role restriction structures are live and enforced on client tab views as well as on API endpoints validation. Default Owner account properties are hardcoded as absolute.
              </span>
            </div>
          </div>

          {/* RECENT HISTORICAL ACTIVITY & AUDIT LOG timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs md:col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-tight">Team Activity & Audit Trails</h4>
                  <p className="text-slate-400 text-[10px] leading-tight">Strict chronological tracking of all invitations, joins, and role adjustments.</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {activityLogs.length === 0 ? (
                  <p className="text-slate-400 font-mono text-[11px] italic py-4 text-center">No organization audit signals tracked yet.</p>
                ) : (
                  activityLogs.map((log, lidx) => (
                    <div key={log.id || lidx} className="flex items-start gap-3 text-xs leading-relaxed border-l-2 border-indigo-100 pl-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-black uppercase text-indigo-550 bg-indigo-50/70 border border-indigo-100 px-1.5 py-0.2 rounded tracking-wide select-all">
                          {log.action}
                        </span>
                        <p className="text-slate-800 text-[11px] font-semibold">{log.details}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Triggered by {log.actor} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(log.createdAt).toLocaleDateString()})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SEAT INFO BAR billing constraints info */}
            <div className="bg-gradient-to-br from-slate-950 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-900/60 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full pointer-events-none" />
              
              <div className="space-y-3 z-10">
                <span className="text-[9px] uppercase tracking-wider bg-indigo-500/20 text-indigo-300 font-black px-2 py-0.5 rounded border border-indigo-550/30">Seats Center</span>
                <h4 className="text-base font-black tracking-tight leading-snug">Autonomous Seat Scaling</h4>
                <p className="text-[11px] text-slate-350 leading-relaxed">
                  RankSyncer matches active user slots directly with your plan tiers. Starter plans support 1 user, Growth allows 5 users, and Agency unlocks unlimited users. Seat pricing handles prorated usage adjustments dynamically.
                </p>
              </div>

              <div className="pt-4 border-t border-indigo-900/50 z-10 flex items-center justify-between mt-4">
                <span className="text-[10px] text-slate-400 font-medium">Scaling Seats</span>
                <span className="text-xs text-indigo-300 font-bold flex items-center gap-1 select-none">
                  Seat Pricing ready <ChevronRight className="h-3 w-3 text-indigo-400" />
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CREATE ORG MODAL */}
      <AnimatePresence>
        {showCreateOrgModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative overflow-hidden"
            >
              <button 
                onClick={() => setShowCreateOrgModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h4 className="text-lg font-black text-slate-900 tracking-tight font-sans">Initialize New Workspace</h4>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">Bind a dedicated brand or agency organization to enable multi-user roles.</p>
              
              <form onSubmit={handleCreateOrg} className="space-y-4 mt-5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Organization Name</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Acme Marketing Group"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-full font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Collaboration Plan</label>
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11.5px] leading-relaxed text-indigo-900 font-semibold">
                    Acme is currently configured on the <strong>{activePlan}</strong>. This plan structures seat caps and limits on invitations.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingOrg}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  {creatingOrg ? 'Spinning up nodes...' : 'Create Organization Workspace'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* INVITE TEAM MEMBER MODAL */}
        {showInviteModal && org && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative overflow-hidden"
            >
              <button 
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h4 className="text-lg font-black text-slate-900 tracking-tight font-sans">Dispatch Member Invitation</h4>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">Send an invitation email to add a team member to the <strong>{org.name}</strong> workspace.</p>

              <form onSubmit={handleInviteSubmit} className="space-y-4 mt-5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Target Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. kate@acme.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-full font-semibold text-slate-850"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Assigned Team Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-full font-bold text-slate-755 select"
                  >
                    <option value="Admin">Admin (Can manage team & content)</option>
                    <option value="Editor">Editor (Can edit & write draft articles)</option>
                    <option value="SEO Manager">SEO Manager (Can manage keywords & tracking)</option>
                    <option value="Viewer">Viewer (Read-only access)</option>
                    <option value="Client">Client (Limited reports viewing)</option>
                  </select>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                  <p className="text-[10px] text-slate-450 font-bold uppercase leading-none">Role Limits Checking</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5 font-medium">
                    This invite corresponds to a seat assignment. Cancelling pending requests instantly restores available workspace slots under your subscription.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {inviting ? 'Dispatching invite...' : 'Dispatch Invitation Mailer'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* CONFIRM TRANSFER OF OWNERSHIP MODAL */}
        {transferTargetId && org && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative overflow-hidden"
            >
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl w-fit mb-3">
                <Shield className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-black text-slate-900 tracking-tight font-sans">Transfer Legal Ownership?</h4>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                You are about to transfer complete Workspace Ownership to{' '}
                <strong className="text-slate-800">
                  {members.find(m => m.userId === transferTargetId)?.name || 'selected member'}
                </strong>.
              </p>
              <p className="text-rose-600 text-[11px] font-bold mt-2.5 bg-rose-50 p-3 rounded-xl border border-rose-100">
                Warning: This action is irreversible. You will be downgraded to the "Admin" privilege level immediately and lose billing ownership.
              </p>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setTransferTargetId(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => transferOwnership(transferTargetId)}
                  disabled={transferring}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-550 text-white rounded-lg text-xs font-black cursor-pointer text-center shadow-xs"
                >
                  {transferring ? 'Transferring...' : 'Yes, Transfer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
