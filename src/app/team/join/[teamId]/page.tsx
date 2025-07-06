'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface JoinStatus {
  status: 'loading' | 'success' | 'error' | 'already_member' | 'invalid_link';
  message: string;
  teamName?: string;
}

export default function TeamJoinPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [joinStatus, setJoinStatus] = useState<JoinStatus>({
    status: 'loading',
    message: 'Verifying invitation...'
  });

  const teamId = params.teamId as string;
  const token = searchParams.get('token');

  const joinTeam = useCallback(async () => {
    try {
      const response = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, token }),
      });

      const data = await response.json();

      if (response.ok) {
        setJoinStatus({
          status: 'success',
          message: `Successfully joined ${data.teamName}!`,
          teamName: data.teamName
        });
      } else if (response.status === 409) {
        setJoinStatus({
          status: 'already_member',
          message: `You're already a member of ${data.teamName}.`,
          teamName: data.teamName
        });
      } else {
        setJoinStatus({
          status: 'error',
          message: data.message || 'Failed to join team.'
        });
      }
    } catch (error) {
      console.error('Error joining team:', error);
      setJoinStatus({
        status: 'error',
        message: 'Network error. Please try again.'
      });
    }
  }, [teamId, token]);

  useEffect(() => {
    if (session && teamId && token) {
      joinTeam();
    } else if (!session) {
      setJoinStatus({
        status: 'error',
        message: 'Please sign in to join the team.'
      });
    } else {
      setJoinStatus({
        status: 'invalid_link',
        message: 'Invalid team invitation link.'
      });
    }
  }, [session, teamId, token, joinTeam]);

  const getStatusIcon = () => {
    switch (joinStatus.status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-primary animate-spin" />;
      case 'success':
      case 'already_member':
        return <CheckCircle className="w-16 h-16 text-green-400" />;
      case 'error':
      case 'invalid_link':
        return <XCircle className="w-16 h-16 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (joinStatus.status) {
      case 'success':
      case 'already_member':
        return 'text-green-400';
      case 'error':
      case 'invalid_link':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1E1E1E] rounded-2xl p-8 border border-[#323232] max-w-md w-full text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-white">Team Invitation</h1>
        </div>

        <div className="mb-6 text-center flex items-center justify-center">
          {getStatusIcon()}
        </div>

        <h2 className={`text-xl font-semibold mb-4 ${getStatusColor()}`}>
          {joinStatus.message}
        </h2>

        {joinStatus.teamName && (
          <div className="bg-[#2A2A2A] rounded-xl p-4 mb-6">
            <p className="text-gray-400 text-sm">Team Name</p>
            <p className="text-white font-semibold">{joinStatus.teamName}</p>
          </div>
        )}

        <div className="space-y-3">
          {joinStatus.status === 'success' || joinStatus.status === 'already_member' ? (
            <>
              <Link
                href="/dashboard"
                className="block w-full bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/guides"
                className="block w-full bg-[#2A2A2A] hover:bg-[#323232] text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-[#323232]"
              >
                View Guides
              </Link>
            </>
          ) : joinStatus.status === 'error' && !session ? (
            <Link
              href="/auth/signin"
              className="block w-full bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Sign In to Join
            </Link>
          ) : (
            <Link
              href="/"
              className="block w-full bg-[#2A2A2A] hover:bg-[#323232] text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-[#323232]"
            >
              Go Home
            </Link>
          )}
        </div>

        {joinStatus.status === 'success' && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-400 text-sm">
              🎉 Welcome to the team! You can now collaborate on guides and access team features.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
