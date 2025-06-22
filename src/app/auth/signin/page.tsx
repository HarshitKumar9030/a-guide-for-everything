'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141414] py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1276px] bg-[#1E1E1E] rounded-[72px] shadow-2xl relative overflow-hidden px-8 py-12 mx-4 md:mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col space-y-8 px-4 md:px-12">
            <h1 className="text-[96px] md:text-[128px] text-white font-just-another-hand leading-none">
              Sign In
            </h1>

            <form onSubmit={handleSignIn} className="flex flex-col space-y-8">
              <div className="flex flex-col space-y-2">
                <label htmlFor="email" className="text-white uppercase text-[16px]">
                  EMAIL
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Please Enter Your Email...."
                  className="p-4 bg-[#272727] text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/60"
                  required
                />
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="password" className="text-white uppercase text-[16px]">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-primary text-sm hover:underline">
                    Forgot Password
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Please Enter Your Password...."
                    className="p-4 pr-12 w-full bg-[#272727] text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#323232] hover:bg-[#3a3a3a] text-white font-just-another-hand text-[32px] py-4 rounded-2xl transition-colors"
              >
                {isLoading ? 'Loading...' : 'Submit'}
              </button>
            </form>

            <p className="text-center text-white">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
          
          <div className="block md:hidden w-full text-center my-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-[#323232]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#1E1E1E] px-6 text-white text-[32px] font-just-another-hand">
                  OR
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col items-center">
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] border-l border-dashed border-[#323232]"></div>

            <div className="flex flex-col items-center mt-12 md:mt-0">
              <div className="relative w-[206px] h-[104px] flex items-center justify-center mb-6">
                <Image src="/logo-transparent.svg" alt="AGFE Logo" width={206} height={104} />
              </div>

              <p className="text-[#D9D9D9] font-just-another-hand text-[32px] mb-6">
                Choose any of these, if you&apos;re lazy :)
              </p>

              <div className="w-[289px] bg-[#272727] rounded-[60px] p-6">
                <div className="grid grid-cols-2 gap-6 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] border-l border-dashed border-[#A2A2A2]"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed border-[#A2A2A2]"></div>
                  <button
                    onClick={() => handleProviderSignIn('google')}
                    className="bg-[#323232] rounded-[32px] h-[108px] flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Image src="/google.svg" alt="Google" width={44} height={44} />
                  </button>

                  <button
                    onClick={() => handleProviderSignIn('github')}
                    className="bg-[#323232] rounded-[32px] h-[108px] flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Image src="/github.svg" alt="GitHub" width={44} height={44} className="invert" />
                  </button>

                  <button
                    onClick={() => handleProviderSignIn('slack')}
                    className="bg-[#323232] rounded-[32px] h-[108px] flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Image src="/slack.svg" alt="Slack" width={44} height={44} />
                  </button>

                  <button
                    onClick={() => handleProviderSignIn('reddit')}
                    className="bg-[#323232] rounded-[32px] h-[108px] flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Image src="/reddit.svg" alt="Reddit" width={128} height={128} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* OR divider for desktop */}
          <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-10">
            <div className="bg-[#1E1E1E] ml-7 px-4 py-2 text-white text-[32px] font-just-another-hand">
              OR
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
