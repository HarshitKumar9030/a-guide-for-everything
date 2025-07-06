'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Users,
  FileText,
  Clock,
  Eye,
  Download,
  Crown,
  Plus,
  Activity,
  Zap,
  Target,
  ArrowLeft,
  MessageCircle,
  Bell,
  Share2,
  Layers
} from 'lucide-react';
import TeamSharing from '@/components/premium/TeamSharing';
import AdvancedTemplates from '@/components/premium/AdvancedTemplates';
import LiveSupport from '@/components/premium/LiveSupport';
import NotificationCenter from '@/components/premium/NotificationCenter';

interface DashboardStats {
  totalGuides: number;
  totalViews: number;
  totalShares: number;
  totalExports: number;
  weeklyData: Array<{
    day: string;
    guides: number;
    views: number;
    exports: number;
  }>;
  modelUsage: Array<{
    model: string;
    count: number;
    color: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    guides: number;
    engagement: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'created' | 'viewed' | 'shared' | 'exported';
    title: string;
    timestamp: Date;
    model?: string;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'proplus'>('free');
  const [activeSection, setActiveSection] = useState<'overview' | 'team' | 'templates' | 'support'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
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

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchDashboardData();
      fetchUserPlan();
    }
  }, [session, timeRange]);

  const statCards = [
    {
      title: 'Total Guides',
      value: stats?.totalGuides || 0,
      icon: FileText,
      color: 'from-primary to-primary/80',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Total Views',
      value: stats?.totalViews || 0,
      icon: Eye,
      color: 'from-slate-500 to-slate-400',
      bgColor: 'bg-slate-500/10'
    },
    {
      title: 'Total Exports',
      value: stats?.totalExports || 0,
      icon: Download,
      color: 'from-neutral-600 to-neutral-500',
      bgColor: 'bg-neutral-600/10'
    },
    {
      title: 'Engagement',
      value: stats ? Math.round((stats.totalViews / Math.max(stats.totalGuides, 1)) * 100) / 100 : 0,
      icon: Activity,
      color: 'from-gray-600 to-gray-500',
      bgColor: 'bg-gray-600/10',
      suffix: 'avg'
    }
  ];

  // Handle authentication redirect in useEffect to avoid render-time state updates
  useEffect(() => {
    if (session === null) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  if (session === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'team':
        return <TeamSharing userPlan={userPlan} />;
      case 'templates':
        return <AdvancedTemplates userPlan={userPlan} />;
      case 'support':
        return <LiveSupport userPlan={userPlan} />;
      default:
        return (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors"
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`}></div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${card.bgColor}`}>
                        <Icon className="w-6 h-6 text-current" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                          {card.suffix && <span className="text-sm text-white/70 ml-1">{card.suffix}</span>}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-white/70 text-sm font-medium">{card.title}</h3>
                  </motion.div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Weekly Activity Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/10"
              >
                <h3 className="text-white text-xl font-semibold mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Weekly Activity
                </h3>
                {(stats?.weeklyData && stats.weeklyData.some(d => d.guides > 0 || d.views > 0 || d.exports > 0)) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="day" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E1E1E', 
                          border: '1px solid #333',
                          borderRadius: '12px',
                          color: '#fff'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="guides" 
                        stackId="1"
                        stroke="#D4AF37" 
                        fill="#D4AF37"
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stackId="1"
                        stroke="#94A3B8" 
                        fill="#94A3B8"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/50">No activity data yet</p>
                      <p className="text-white/30 text-sm">Create some guides to see your activity</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Model Usage Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/10"
              >
                <h3 className="text-white text-xl font-semibold mb-6 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-primary" />
                  AI Model Usage
                </h3>
                {(stats?.modelUsage && stats.modelUsage.length > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.modelUsage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: { name: string; percent?: number }) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {stats.modelUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E1E1E', 
                          border: '1px solid #333',
                          borderRadius: '12px',
                          color: '#fff'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/50">No AI usage yet</p>
                      <p className="text-white/30 text-sm">Use AI features to see your model usage</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/10 mb-8"
            >
              <h3 className="text-white text-xl font-semibold mb-6 flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                Recent Activity
              </h3>
              {(stats?.recentActivity && stats.recentActivity.length > 0) ? (
                <div className="space-y-4">
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-[#333] rounded-xl">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'created' ? 'bg-green-500/20 text-green-400' :
                        activity.type === 'viewed' ? 'bg-blue-500/20 text-blue-400' :
                        activity.type === 'shared' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {activity.type === 'created' && <Plus className="w-4 h-4" />}
                        {activity.type === 'viewed' && <Eye className="w-4 h-4" />}
                        {activity.type === 'shared' && <Users className="w-4 h-4" />}
                        {activity.type === 'exported' && <Download className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-white/50 text-sm capitalize">{activity.type}</p>
                      </div>
                      <div className="text-white/30 text-sm">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">No recent activity</p>
                  <p className="text-white/30 text-sm">Your recent actions will appear here</p>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-white text-xl font-semibold mb-6 flex items-center gap-3">
                <Target className="w-6 h-6 text-primary" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/guides')}
                  className="w-full bg-primary hover:bg-primary/80 text-black py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create New Guide
                </button>
                <button
                  onClick={() => router.push('/guides')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  View My Guides
                </button>
                {userPlan === 'free' && (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade Plan
                  </button>
                )}
              </div>
            </motion.div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-cyan-400/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </motion.button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-white font-just-another-hand text-[64px] md:text-[96px] leading-none mb-2">
                  Dashboard
                </h1>
                <p className="text-white/70 text-lg">
                  Analytics and insights for your guides
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                {/* Time Range Selector */}
                <div className="flex gap-1 bg-[#2A2A2A] rounded-xl p-1 border border-white/10">
                  {(['7d', '30d', '90d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-primary text-black'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                    </button>
                  ))}
                </div>

                {/* Plan Badge */}
                <div className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize border ${
                  userPlan === 'proplus' ? 'bg-primary/20 text-primary border-primary/30' :
                  userPlan === 'pro' ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' :
                  'bg-neutral-600/20 text-neutral-300 border-neutral-600/30'
                }`}>
                  <Crown className="w-4 h-4 inline mr-2" />
                  {userPlan === 'proplus' ? 'Pro+' : userPlan}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-2 bg-[#2A2A2A] rounded-2xl p-2 border border-white/10">
              <button
                onClick={() => setActiveSection('overview')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeSection === 'overview'
                    ? 'bg-primary text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveSection('team')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeSection === 'team'
                    ? 'bg-primary text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Team Sharing
              </button>
              <button
                onClick={() => setActiveSection('templates')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeSection === 'templates'
                    ? 'bg-primary text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-4 h-4" />
                Templates
              </button>
              <button
                onClick={() => setActiveSection('support')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeSection === 'support'
                    ? 'bg-primary text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Support
              </button>
              <button
                onClick={() => setShowNotifications(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors ml-auto"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
            </div>
          </motion.div>

          {/* Main Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {renderSectionContent()}
            </motion.div>
          )}
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  );
}
