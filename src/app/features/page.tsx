'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Crown, Users, FileText, MessageCircle, Sparkles, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import TeamSharing from '@/components/premium/TeamSharing';
import AdvancedTemplates from '@/components/premium/AdvancedTemplates';
import LiveSupport from '@/components/premium/LiveSupport';

export default function FeaturesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'proplus'>('free');
  const [activeFeature, setActiveFeature] = useState<'team' | 'templates' | 'support'>('team');

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

  const features = [
    {
      id: 'team' as const,
      title: 'Team Sharing',
      subtitle: 'Collaborate with your team',
      description: 'Share guides with team members, collaborate on projects, and manage access permissions.',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      planRequired: 'proplus' as const,
      benefits: [
        'Invite unlimited team members',
        'Share guides with one click',
        'Manage team permissions',
        'Real-time collaboration',
        'Team analytics and insights'
      ]
    },
    {
      id: 'templates' as const,
      title: 'Advanced Templates',
      subtitle: 'Professional templates for any use case',
      description: 'Access a library of professional templates for business, education, and personal projects.',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      planRequired: 'pro' as const,
      benefits: [
        'Business report templates',
        'Educational content templates',
        'Technical documentation',
        'Personal journal templates',
        'Custom template creation'
      ]
    },
    {
      id: 'support' as const,
      title: 'Premium Support',
      subtitle: 'Get help when you need it',
      description: 'Priority email support for Pro users, live chat for Pro+ users.',
      icon: MessageCircle,
      color: 'from-green-500 to-emerald-500',
      planRequired: 'pro' as const,
      benefits: [
        'Priority email support (Pro)',
        'Live chat support (Pro+)',
        'Technical assistance',
        'Feature requests',
        'Dedicated account manager (Pro+)'
      ]
    }
  ];

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'team':
        return <TeamSharing userPlan={userPlan} />;
      case 'templates':
        return <AdvancedTemplates userPlan={userPlan} />;
      case 'support':
        return <LiveSupport userPlan={userPlan} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
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

            <h1 className="text-white font-just-another-hand text-[96px] md:text-[128px] leading-none mb-6">
              Premium Features
            </h1>
            <p className="text-white/70 text-xl max-w-3xl mx-auto mb-8">
              Unlock powerful features to enhance your workflow and collaboration
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
              {userPlan === 'free' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/pricing')}
                  className="ml-2 bg-primary hover:bg-primary/80 text-black px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  Upgrade <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Feature Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center mb-12"
          >
            <div className="flex gap-2 bg-[#2A2A2A] rounded-2xl p-2 border border-white/10">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isActive = activeFeature === feature.id;
                const hasAccess = userPlan === 'proplus' || 
                  (userPlan === 'pro' && feature.planRequired !== 'proplus');

                return (
                  <motion.button
                    key={feature.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveFeature(feature.id)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-primary text-black' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{feature.title}</span>
                    {!hasAccess && <Crown className="w-4 h-4 text-primary" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Feature Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:col-span-1"
            >
              {features.map((feature) => {
                if (feature.id !== activeFeature) return null;
                
                const Icon = feature.icon;
                const hasAccess = userPlan === 'proplus' || 
                  (userPlan === 'pro' && feature.planRequired !== 'proplus');

                return (
                  <div key={feature.id} className="bg-[#2A2A2A] rounded-2xl p-8 border border-white/10">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 mb-6`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">{feature.title}</h2>
                    <p className="text-primary font-semibold mb-4">{feature.subtitle}</p>
                    <p className="text-white/70 mb-6">{feature.description}</p>

                    <div className="mb-6">
                      <h3 className="text-white font-semibold mb-3">Key Benefits:</h3>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center gap-3 text-white/70">
                            <Star className="w-4 h-4 text-primary flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {!hasAccess && (
                      <div className="pt-6 border-t border-white/10">
                        <p className="text-yellow-400 text-sm mb-4 flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          {feature.planRequired === 'proplus' ? 'Pro+ Required' : 'Pro Required'}
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
                );
              })}
            </motion.div>

            {/* Interactive Feature Demo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="bg-[#2A2A2A] rounded-2xl border border-white/10 min-h-[600px] overflow-hidden">
                {renderFeatureContent()}
              </div>
            </motion.div>
          </div>

          {/* CTA Section */}
          {userPlan === 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center mt-16"
            >
              <div className="bg-gradient-to-r from-primary/20 to-cyan-400/20 rounded-3xl p-8 border border-primary/30">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold text-white">Ready to unlock these features?</h2>
                </div>
                <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                  Upgrade to Pro or Pro+ to access advanced templates, team collaboration, and premium support.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/pricing')}
                  className="bg-primary hover:bg-primary/80 text-black px-8 py-4 rounded-2xl font-bold text-lg transition-colors flex items-center gap-3 mx-auto"
                >
                  <Crown className="w-6 h-6" />
                  View Pricing Plans
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
