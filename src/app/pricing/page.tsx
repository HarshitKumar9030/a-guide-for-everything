'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Sparkles, Users, FileText, Clock, MessageCircle, Star, ArrowRight, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const PricingPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: 'pro' | 'proplus', period: 'monthly' | 'yearly') => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setLoading(plan);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, period }),
      });

      const { sessionId, url } = await response.json();
      
      if (response.ok && sessionId) {
        // Redirect to Stripe checkout
        window.location.href = url || `https://checkout.stripe.com/c/pay/${sessionId}`;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      features: [
  '6 Kimi (Base) guides per day',
        '4 Gemini guides per day', 
        '4 DeepSeek guides per day',
        'Basic guide generation',
        'Export with 6-hour cooldown',
        'Community support'
      ],
      limitations: [
        'No GPT-4.1 access',
        'No O3 Mini access',
        'Limited daily generations',
        'Basic templates only'
      ],
      cta: 'Current Plan',
      ctaAction: () => router.push('/'),
      popular: false,
      gradient: 'from-gray-600/20 to-gray-700/20',
      borderColor: 'border-white/10'
    },
    {
      name: 'Pro',
      description: 'For power users who need more',
      price: { monthly: 19, yearly: 190 },
      features: [
  '20 Kimi (Base) guides per day',
        '15 Gemini guides per day',
        '15 DeepSeek guides per day',
        '10 O3 Mini guides per day',
        'Priority processing',
        'Export with 1-hour cooldown',
        'Email support',
        'Advanced templates',
        'Collections & organization',
        'Custom export formats'
      ],
      limitations: [
        'No GPT-4.1 access (Pro+ exclusive)'
      ],
      cta: 'Upgrade to Pro',
      ctaAction: () => handleUpgrade('pro', billingPeriod),
      popular: true,
      gradient: 'from-primary/20 to-cyan-400/20',
      borderColor: 'border-primary/50'
    },
    {
      name: 'Pro+',
      description: 'Maximum power and features',
      price: { monthly: 39, yearly: 390 },
      features: [
        'Unlimited access to all models',
        'Unlimited GPT-4.1 guides',
        'Unlimited GPT-4.1 Mini guides',
        'Unlimited O3 Mini guides',
        'Highest priority processing',
        'Instant export (no cooldown)',
        'Live chat support',
        'Advanced templates',
        'Team sharing & collaboration',
        'Early access to new models',
        'Custom integrations',
        'API access'
      ],
      limitations: [],
      cta: 'Upgrade to Pro+',
      ctaAction: () => handleUpgrade('proplus', billingPeriod),
      popular: false,
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-400/50'
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Generate comprehensive guides in seconds with our optimized AI models.'
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: 'Premium Models',
      description: 'Access to GPT-4.1, O3 Mini, and other cutting-edge AI models.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Share guides with your team and collaborate on projects seamlessly.'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Advanced Templates',
      description: 'Professional templates for business, education, and personal use.'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Priority Processing',
      description: 'Skip the queue with priority processing for faster generation.'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Premium Support',
      description: 'Get help when you need it with email and live chat support.'
    }
  ];

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
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Home
            </motion.button>

            <h1 className="font-just-another-hand text-6xl md:text-8xl text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
              Unlock the full potential of AI-powered guide generation with plans designed for every need.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-sm font-medium transition-colors ${billingPeriod === 'monthly' ? 'text-white' : 'text-white/60'}`}>
                Monthly
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-16 h-8 bg-white/10 rounded-full border border-white/20 transition-colors"
              >
                <motion.div 
                  className="absolute top-1 w-6 h-6 bg-primary rounded-full shadow-lg"
                  animate={{ x: billingPeriod === 'yearly' ? 32 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
              <span className={`text-sm font-medium transition-colors ${billingPeriod === 'yearly' ? 'text-white' : 'text-white/60'}`}>
                Yearly
              </span>
              {billingPeriod === 'yearly' && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-primary text-black text-xs px-3 py-1 rounded-full font-bold"
                >
                  Save 17%
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-[#1E1E1E] border ${plan.borderColor} rounded-[24px] p-8 overflow-hidden backdrop-blur-sm ${
                  plan.popular ? 'scale-105 lg:scale-110' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-6 right-6">
                    <div className="bg-primary text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50`} />
                
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-white/70 text-sm mb-8">{plan.description}</p>
                  
                  <div className="mb-8">
                    <span className="text-5xl font-bold text-white">
                      ${plan.price[billingPeriod]}
                    </span>
                    <span className="text-white/60 ml-2 text-lg">
                      /{billingPeriod === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-white/90 text-sm">{feature}</span>
                      </motion.div>
                    ))}
                    {plan.limitations.map((limitation, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * (plan.features.length + idx) }}
                        className="flex items-start gap-3 opacity-60"
                      >
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="w-3 h-3 text-white/60" />
                        </div>
                        <span className="text-white/60 text-sm">{limitation}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={plan.ctaAction}
                    disabled={loading === plan.name.toLowerCase()}
                    className={`w-full py-4 px-6 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/80 text-black shadow-lg shadow-primary/25'
                        : plan.name === 'Free'
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    } ${loading === plan.name.toLowerCase() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading === plan.name.toLowerCase() ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        {plan.name !== 'Free' && <ArrowRight className="w-4 h-4" />}
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-20"
          >
            <h2 className="font-just-another-hand text-5xl md:text-6xl text-white text-center mb-4">
              Why Choose AGFE?
            </h2>
            <p className="text-white/70 text-center mb-12 max-w-2xl mx-auto text-lg">
              Our platform offers cutting-edge AI technology with features designed to boost your productivity.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center bg-[#1E1E1E] border border-white/10 rounded-3xl p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10" />
            <div className="relative z-10">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="font-just-another-hand text-4xl md:text-5xl text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto text-lg">
                Join thousands of users who are already creating amazing guides with our AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/')}
                  className="bg-primary hover:bg-primary/80 text-black font-medium py-4 px-8 rounded-2xl transition-colors shadow-lg shadow-primary/25"
                >
                  Start Free Trial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(session ? '/profile' : '/auth/signin')}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-4 px-8 rounded-2xl transition-colors"
                >
                  {session ? 'View Profile' : 'Sign In'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
