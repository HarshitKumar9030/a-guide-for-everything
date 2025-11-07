'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Crown, ArrowRight, ArrowLeft, Star, Sparkles } from 'lucide-react';
import TeamSharing from '@/components/premium/TeamSharing';

export default function TeamSharingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'proplus'>('free');

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPlan();
    }
  }, [session]);

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setUserPlan(data.subscription?.plan || 'free');
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const hasAccess = userPlan === 'proplus';

  const benefits = [
    'Invite unlimited team members',
    'Share guides with one click',
    'Manage team permissions',
    'Real-time collaboration',
    'Team analytics and insights',
    'Advanced access controls',
    'Team workspace management'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors mb-8 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </motion.button>

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-5 mx-auto mb-6">
              <Users className="w-full h-full text-white" />
            </div>

            <h1 className="text-white font-just-another-hand text-[96px] md:text-[128px] leading-none mb-6">
              Team Sharing
            </h1>
            <p className="text-white/70 text-xl max-w-3xl mx-auto mb-8">
              Collaborate with your team in real-time, share guides, and manage permissions
            </p>

            {/* Plan Status */}
            <div className="inline-flex items-center gap-3 bg-[#2A2A2A] rounded-2xl px-6 py-4 border border-white/10">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-white font-semibold">Current Plan: </span>
              <span className={`px-3 py-1 rounded-lg text-sm font-semibold capitalize ${
                userPlan === 'proplus' ? 'bg-purple-500/20 text-purple-300' :
                userPlan === 'pro' ? 'bg-primary/20 text-primary' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {userPlan === 'proplus' ? 'Pro+' : userPlan}
              </span>
              {!hasAccess && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/pricing')}
                  className="ml-2 bg-primary hover:bg-primary/80 text-black px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  Upgrade to Pro+ <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:col-span-1"
            >
              <div className="bg-[#2A2A2A] rounded-2xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-2">Team Collaboration</h2>
                <p className="text-blue-400 font-semibold mb-4">Collaborate with your team</p>
                <p className="text-white/70 mb-6">
                  Share guides with team members, collaborate on projects in real-time, and manage access permissions with advanced controls.
                </p>

                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3">Key Benefits:</h3>
                  <ul className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-3 text-white/70">
                        <Star className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {!hasAccess && (
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-yellow-400 text-sm mb-4 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Pro+ Required
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/pricing')}
                      className="w-full bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      Upgrade Now <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Interactive Feature Demo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="bg-[#2A2A2A] rounded-2xl border border-white/10 min-h-[600px] overflow-hidden">
                <TeamSharing userPlan={userPlan} />
              </div>
            </motion.div>
          </div>

          {/* CTA Section */}
          {!hasAccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center mt-16"
            >
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-3xl p-8 border border-blue-500/30">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                  <h2 className="text-3xl font-bold text-white">Ready to collaborate with your team?</h2>
                </div>
                <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                  Upgrade to Pro+ to unlock team sharing, real-time collaboration, and advanced permission management.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/pricing')}
                  className="bg-primary hover:bg-primary/80 text-black px-8 py-4 rounded-2xl font-bold text-lg transition-colors flex items-center gap-3 mx-auto"
                >
                  <Crown className="w-6 h-6" />
                  Upgrade to Pro+
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
