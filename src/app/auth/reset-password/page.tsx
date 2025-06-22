'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsSuccess(true);
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);

    } catch (error) {
      console.error('Password reset error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[#1E1E1E] rounded-[32px] p-8 shadow-xl border border-[#323232]">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <KeyRound size={32} className="text-red-400" />
            </div>
            
            <h1 className="text-white font-just-another-hand text-[48px] leading-none mb-4">
              Invalid Link
            </h1>
            
            <p className="text-[#A2A2A2] text-sm mb-8">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            
            <Link
              href="/auth/forgot-password"
              className="w-full h-[56px] bg-primary hover:bg-primary/90 text-[#1E1E1E] font-semibold rounded-2xl transition-all flex items-center justify-center"
            >
              Request New Reset Link
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[#1E1E1E] rounded-[32px] p-8 shadow-xl border border-[#323232]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={32} className="text-green-400" />
            </motion.div>
            
            <h1 className="text-white font-just-another-hand text-[48px] leading-none mb-4">
              Password Reset!
            </h1>
            
            <p className="text-[#A2A2A2] text-sm mb-8">
              Your password has been successfully reset. You will be redirected to sign in shortly.
            </p>
            
            <Link
              href="/auth/signin"
              className="w-full h-[56px] bg-primary hover:bg-primary/90 text-[#1E1E1E] font-semibold rounded-2xl transition-all flex items-center justify-center"
            >
              Sign In Now
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#1E1E1E] rounded-[32px] p-8 shadow-xl border border-[#323232]">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                <KeyRound size={32} className="text-primary" />
              </div>
            </div>
            
            <h1 className="text-white font-just-another-hand text-[64px] leading-none mb-2">
              Reset Password
            </h1>
            
            <p className="text-[#A2A2A2] text-sm">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-white text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-[56px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Enter your new password"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-white text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[56px] px-4 bg-[#2A2A2A] text-white rounded-2xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Confirm your new password"
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

            <button
              type="submit"
              disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full h-[56px] bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-[#1E1E1E] font-semibold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#323232] text-center">
            <Link
              href="/auth/signin"
              className="text-[#A2A2A2] hover:text-primary transition-colors text-sm"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
