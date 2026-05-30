import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Mail, 
  Globe2, 
  User, 
  Users, 
  Check, 
  AlertCircle,
  Archive,
  ArrowRightLeft,
  ChevronDown,
  Building,
  UserPlus
} from "lucide-react";
import { AgencyClient, AgencyMember } from "../types";

interface ClientManagementTabProps {
  clients: AgencyClient[];
  team: AgencyMember[];
  onAddClient: (payload: { name: string; websites: string[]; assignedMembers: string[]; invitedEmail?: string }) => Promise<void>;
  onUpdateClient: (clientId: string, payload: Partial<AgencyClient>) => Promise<void>;
  onArchiveClient: (clientId: string) => Promise<void>;
  onInviteClient: (clientId: string, email: string) => Promise<void>;
}

export default function ClientManagementTab({
  clients,
  team,
  onAddClient,
  onUpdateClient,
  onArchiveClient,
  onInviteClient
}: ClientManagementTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientWebsites, setNewClientWebsites] = useState("");
  const [newClientInvitedEmail, setNewClientInvitedEmail] = useState("");
  const [newClientAssigned, setNewClientAssigned] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Invite states
  const [inviteEmailMap, setInviteEmailMap] = useState<Record<string, string>>({});
  // Ownership Transfer dropdown
  const [showTransferMap, setShowTransferMap] = useState<Record<string, boolean>>({});

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setLoading(true);
    try {
      const domains = newClientWebsites
        .split(",")
        .map(w => w.trim())
        .filter(w => w.length > 0);
      
      await onAddClient({
        name: newClientName,
        websites: domains,
        assignedMembers: newClientAssigned,
        invitedEmail: newClientInvitedEmail || undefined
      });

      // Clear form
      setNewClientName("");
      setNewClientWebsites("");
      setNewClientInvitedEmail("");
      setNewClientAssigned([]);
      setShowCreateModal(false);
    } catch (err: any) {
      alert(`Could not register client: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchInvite = async (clientId: string) => {
    const email = inviteEmailMap[clientId];
    if (!email || !email.includes("@")) {
      alert("Please provide a valid recipient email address.");
      return;
    }
    try {
      await onInviteClient(clientId, email);
      setInviteEmailMap(prev => ({ ...prev, [clientId]: "" }));
      alert(`Client dashboard credentials successfully sent to ${email}`);
    } catch (err: any) {
      alert(`Failed to dispatch invite: ${err.message}`);
    }
  };

  const handleToggleAssign = (userId: string) => {
    setNewClientAssigned(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleTransferOwnership = async (clientId: string, targetUserId: string) => {
    const targetMember = team.find(t => t.user_id === targetUserId);
    if (!targetMember) return;
    const confirmTransfer = window.confirm(`Are you sure you want to transfer primary account management for this client portal to ${targetMember.name}?`);
    if (!confirmTransfer) return;

    try {
      // Reassign all assigned members to contain this target member
      await onUpdateClient(clientId, {
        assignedMembers: [targetUserId]
      });
      setShowTransferMap(prev => ({ ...prev, [clientId]: false }));
      alert(`Ownership successfully transferred to ${targetMember.name}`);
    } catch (err: any) {
      alert(`Failed to transfer client portal ownership: ${err.message}`);
    }
  };

  // Toggle assigning existing crew to active clients
  const handleToggleCrewForClient = async (client: AgencyClient, userId: string) => {
    const isAssigned = client.assignedMembers.includes(userId);
    const updatedMembers = isAssigned
      ? client.assignedMembers.filter(id => id !== userId)
      : [...client.assignedMembers, userId];
    
    try {
      await onUpdateClient(client.client_id, {
        assignedMembers: updatedMembers
      });
    } catch (err: any) {
      console.error("[TOGGLE CREW ASSIGN FAIL]:", err);
    }
  };

  return (
    <div className="space-y-6" id="client-management-tab">
      
      {/* Tab Header Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight">Active Client Registries</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Track workspace permissions, associated web domains, and secure report distribution.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-black rounded-xl cursor-pointer transition-all flex items-center gap-1.5 self-start"
          id="btn-trigger-create-client"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Corporate Client
        </button>
      </div>

      {/* Creation Modal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Create Client Portal</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Corporate Client Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Acme Labs Co"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Client Websites (Comma separated)</label>
                <input 
                  type="text"
                  placeholder="e.g. acmelabs.net, portal.acmelabs.net"
                  value={newClientWebsites}
                  onChange={e => setNewClientWebsites(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-indigo-500 font-semibold"
                />
                <span className="text-[9px] text-slate-400 block mt-1 font-bold">Registers individual domains to the White-Label console filter list automatically.</span>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Direct Invitation Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input 
                    type="email"
                    placeholder="e.g. director@acmelabs.net"
                    value={newClientInvitedEmail}
                    onChange={e => setNewClientInvitedEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-indigo-500 font-semibold"
                  />
                </div>
                <span className="text-[9px] text-slate-400 block mt-1 font-bold">If provided, triggers a pending credentials link for dedicated portal viewer slots.</span>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Assign Initial Staff</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {team.map(member => {
                    const isSelected = newClientAssigned.includes(member.user_id);
                    return (
                      <button
                        type="button"
                        key={member.user_id}
                        onClick={() => handleToggleAssign(member.user_id)}
                        className={`w-full flex items-center justify-between text-left p-2 rounded-lg text-xs font-black cursor-pointer transition-all ${
                          isSelected ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-slate-650 hover:bg-slate-100'
                        }`}
                      >
                        <span>{member.name} ({member.role})</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-650" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  {loading ? "Generating Module..." : "Provision Portal Group"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Roster Container */}
      <div className="space-y-4">
        {clients.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <Building className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-black text-slate-600 uppercase">Roster empty</p>
            <p className="text-xs text-slate-400 mt-1">Enlist corporate client nodes above to manage websites collaboratively.</p>
          </div>
        ) : (
          clients.map(client => {
            const isArchived = client.status === "archived";
            
            return (
              <div 
                key={client.client_id}
                className={`bg-white border text-slate-800 rounded-2xl shadow-3xs p-5 transition-all relative ${
                  isArchived ? "opacity-60 bg-slate-50/50 border-dashed border-slate-200" : "border-slate-100 hover:border-slate-200"
                }`}
              >
                {isArchived && (
                  <span className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Archive className="h-3 w-3" />
                    Archived Portal
                  </span>
                )}

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  {/* Left Column: Client Details */}
                  <div className="space-y-4 max-w-md">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        {client.name}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          client.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {client.status}
                        </span>
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {client.websites.map(domain => (
                          <span 
                            key={domain}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold font-mono text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-100 cursor-pointer"
                          >
                            <Globe2 className="h-2.5 w-2.5 text-indigo-500" />
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Inviting Segment */}
                    <div className="pt-3 border-t border-slate-50 space-y-2">
                      <span className="block text-[9px] uppercase font-bold text-slate-400">External Client Security Onboarding</span>
                      
                      {client.invitedEmail ? (
                        <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 max-w-sm">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-650 truncate">{client.invitedEmail}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.1 rounded-md shrink-0 ml-auto ${
                            client.inviteStatus === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-850'
                          }`}>
                            Invite {client.inviteStatus}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 max-w-xs">
                          <input 
                            type="email"
                            placeholder="director@client.com"
                            value={inviteEmailMap[client.client_id] || ""}
                            onChange={e => {
                              const val = e.target.value;
                              setInviteEmailMap(prev => ({ ...prev, [client.client_id]: val }));
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-indigo-500 font-semibold w-full"
                          />
                          <button
                            onClick={() => handleDispatchInvite(client.client_id)}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0"
                          >
                            <UserPlus className="h-3 w-3" />
                            Invite
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Crew Configuration */}
                  <div className="space-y-2 lg:min-w-[200px]">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Team Account Managers Assigned</span>
                    
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 max-h-32 overflow-y-auto">
                      {team.map(member => {
                        const isAssigned = client.assignedMembers.includes(member.user_id);
                        return (
                          <div 
                            key={member.user_id} 
                            onClick={() => handleToggleCrewForClient(client, member.user_id)}
                            className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-all select-none ${
                              isAssigned ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-slate-200/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`h-1.5 w-1.5 rounded-full ${isAssigned ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                              <span className="text-xs font-semibold text-slate-750 truncate">{member.name}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                              {member.role.replace("_", " ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Ownership Transfer & Actions */}
                  <div className="flex flex-col items-stretch sm:items-end justify-between gap-3 shrink-0 lg:min-w-[170px]">
                    
                    {/* Ownership Transfer dropdown container */}
                    <div className="relative w-full">
                      <button
                        onClick={() => setShowTransferMap(prev => ({ ...prev, [client.client_id]: !prev[client.client_id] }))}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-350 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer"
                      >
                        <span className="flex items-center gap-1 shrink-0">
                          <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />
                          Primary Lead
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      </button>

                      {showTransferMap[client.client_id] && (
                        <div className="absolute right-0 z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto">
                          <span className="block px-2.5 py-1 text-[8px] uppercase font-extrabold text-slate-400">Transfer Portfolio To:</span>
                          <div className="divide-y divide-slate-50">
                            {team.map(crew => (
                              <button
                                key={crew.user_id}
                                onClick={() => handleTransferOwnership(client.client_id, crew.user_id)}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 block truncate cursor-pointer"
                              >
                                {crew.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Archive toggle button */}
                    <button
                      onClick={() => onArchiveClient(client.client_id)}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border w-full ${
                        isArchived 
                        ? 'border-indigo-600 text-indigo-750 bg-indigo-50/40 hover:bg-indigo-50' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Archive className="h-3.5 w-3.5" />
                      {isArchived ? "De-Archive Client" : "Archive Workspace"}
                    </button>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
