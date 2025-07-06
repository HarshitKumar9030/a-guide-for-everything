'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, X, Mail, Copy, Check, Crown } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'member';
  joinedAt: Date;
  status: 'active' | 'pending' | 'declined';
}

interface TeamSharingProps {
  userPlan: 'free' | 'pro' | 'proplus';
}

export default function TeamSharing({ userPlan }: TeamSharingProps) {
  const { data: session } = useSession();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Team sharing is only available for Pro+ users
  const hasTeamAccess = userPlan === 'proplus';

  useEffect(() => {
    if (hasTeamAccess) {
      // Load team members
      loadTeamMembers();
      generateShareableLink();
    }
  }, [hasTeamAccess]);

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/members');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const generateShareableLink = async () => {
    try {
      const response = await fetch('/api/team/share-link');
      if (response.ok) {
        const data = await response.json();
        setShareableLink(data.link);
      }
    } catch (error) {
      console.error('Error generating shareable link:', error);
    }
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !hasTeamAccess) return;

    // Prevent self-invitation
    if (session?.user?.email && inviteEmail.toLowerCase() === session.user.email.toLowerCase()) {
      showStatus('error', 'You cannot invite yourself to the team');
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (response.ok) {
        setInviteEmail('');
        await loadTeamMembers();
        showStatus('success', 'Invitation sent successfully!');
      } else {
        const error = await response.json();
        showStatus('error', error.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      showStatus('error', 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!hasTeamAccess) return;

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTeamMembers();
        showStatus('success', 'Member removed successfully!');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      showStatus('error', 'Failed to remove member');
    }
  };

  const copyShareableLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      showStatus('success', 'Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      showStatus('error', 'Failed to copy link');
    }
  };

  // Helper function to show status messages
  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  if (!hasTeamAccess) {
    return (
      <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-[#323232]">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-gray-400" />
          <h3 className="text-white text-xl font-semibold">Team Sharing</h3>
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <p className="text-gray-400 mb-4">
          Share guides with your team and collaborate on projects. Available with Pro+ plan.
        </p>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Upgrade to Pro+
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-[#323232]">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h3 className="text-white text-xl font-semibold">Team Sharing</h3>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-4 p-4 rounded-xl border-l-4 ${statusMessage.type === 'success' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
          <p className={`text-sm ${statusMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {statusMessage.text}
          </p>
        </div>
      )}

      {/* Invite Member */}
      <form onSubmit={inviteMember} className="mb-6">
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Enter team member's email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#1E1E1E] text-white rounded-xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isInviting || (!!session?.user?.email && inviteEmail.toLowerCase() === session.user.email.toLowerCase())}
            className="bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={!!session?.user?.email && inviteEmail.toLowerCase() === session.user.email.toLowerCase() ? "You cannot invite yourself" : ""}
          >
            {isInviting ? (
              <>Inviting...</>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Invite
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Shareable Link */}
      {shareableLink && (
        <div className="mb-6 p-4 bg-[#1E1E1E] rounded-xl border border-[#323232]">
          <p className="text-gray-400 text-sm mb-2">Shareable Link</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareableLink}
              readOnly
              className="flex-1 px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-lg border border-[#323232] font-mono"
            />
            <button
              onClick={copyShareableLink}
              className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#323232] text-white rounded-lg border border-[#323232] transition-colors flex items-center gap-2"
            >
              {linkCopied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div>
        <h4 className="text-white font-semibold mb-4">Team Members ({teamMembers.length})</h4>
        {teamMembers.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No team members yet. Invite someone to start collaborating!
          </p>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-[#1E1E1E] rounded-xl border border-[#323232]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {member.name || member.email}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {member.role} • {member.status}
                    </p>
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
