'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setMessage('Password reset link has been sent to your email');
      setIsEmailSent(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendEmail = async () => {
    setIsEmailSent(false);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(fakeEvent);
  };

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#1E1E1E] rounded-[32px] p-8 shadow-xl border border-[#323232]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Mail size={32} className="text-primary" />
              </div>
            </div>
            
            <h1 className="text-white font-just-another-hand text-[64px] leading-none mb-2">
              {isEmailSent ? 'Check Email' : 'Forgot Password'}
            </h1>
            
            <p className="text-[#A2A2A2] text-sm">
              {isEmailSent 
                ? 'We\'ve sent a password reset link to your email address'
                : 'Enter your email address and we\'ll send you a link to reset your password'
              }
            </p>
          </div>

          {!isEmailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[56px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-900/20 border border-red-500 rounded-xl p-4"
                >
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-900/20 border border-green-500 rounded-xl p-4"
                >
                  <p className="text-green-300 text-sm">{message}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full h-[56px] bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-[#1E1E1E] font-semibold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-900/20 border border-green-500 rounded-xl p-4 text-center"
              >                <p className="text-green-300 text-sm mb-2">{message}</p>
                <p className="text-[#A2A2A2] text-xs">
                  Check your spam folder if you don&apos;t see the email
                </p>
              </motion.div>

              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full h-[56px] bg-[#323232] hover:bg-[#3a3a3a] text-white font-medium rounded-2xl transition-all"
                >
                  {isLoading ? 'Sending...' : 'Resend Email'}
                </button>
                  <Link
                  href="/auth/signin"
                  className="w-full h-[56px] bg-transparent border border-[#323232] hover:border-primary text-white font-medium rounded-2xl transition-all flex items-center justify-center"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#323232]">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <Link
                href="/auth/signin"
                className="flex items-center text-[#A2A2A2] hover:text-white transition-colors"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Sign In
              </Link>
              
              <span className="text-[#323232]">•</span>
              
              <Link
                href="/auth/signup"
                className="text-[#A2A2A2] hover:text-primary transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
