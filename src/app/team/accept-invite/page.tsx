'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Users, Check, X, Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    team?: { name: string; memberCount: number };
  } | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to sign in with return URL
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
    }
  }, [status, router]);

  const acceptInvitation = async () => {
    if (!token || !session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setResult({
        success: false,
        message: 'Failed to process invitation'
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg mb-4">Please sign in to accept the team invitation</p>
          <div className="animate-pulse">Redirecting to sign in...</div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-[#2A2A2A] rounded-2xl p-8 border border-[#323232] max-w-md">
            <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
            <p className="text-gray-400 mb-6">
              This invitation link is missing required information.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#2A2A2A] rounded-2xl p-8 border border-[#323232] max-w-md w-full"
      >
        {result ? (
          <div className="text-center">
            {result.success ? (
              <>
                <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Welcome to the Team!</h1>
                <p className="text-gray-400 mb-4">{result.message}</p>
                {result.team && (
                  <div className="bg-[#1E1E1E] rounded-xl p-4 mb-6">
                    <p className="text-white font-semibold">{result.team.name}</p>
                    <p className="text-gray-400 text-sm">
                      {result.team.memberCount} member{result.team.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-400">
                  Redirecting to dashboard in a few seconds...
                </p>
              </>
            ) : (
              <>
                <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Invitation Failed</h1>
                <p className="text-gray-400 mb-6">{result.message}</p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Go to Dashboard
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Users className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Team Invitation</h1>
            <p className="text-gray-400 mb-6">
              You&apos;ve been invited to join a team for collaborative guide editing.
            </p>
            <p className="text-white mb-6">
              Signed in as: <span className="font-semibold">{session?.user?.email}</span>
            </p>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={acceptInvitation}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Accept Invitation
                  </>
                )}
              </motion.button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-[#1E1E1E] hover:bg-[#323232] text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-[#323232]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
