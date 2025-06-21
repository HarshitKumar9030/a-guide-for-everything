'use client';

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, ExternalLink, Loader2 } from 'lucide-react';
import { github_url } from '../constants';
import Image from 'next/image';

export default function ResponsiveLayout() {
  const { isMobile } = useResponsive();
  // Show loading state on initial render to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  const [showLoader, setShowLoader] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      // Add a slight delay before hiding loader for smooth transition
      setTimeout(() => {
        setShowLoader(false);
      }, 100);
    }, 3000); 

    return () => clearTimeout(timer);  }, []);

  return (
    <AnimatePresence mode="wait">
      {showLoader ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 0.95
          }}
          transition={{ 
            duration: 0.5,
            ease: "easeInOut"
          }}
          className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-[#141414] to-[#1E1E1E]"
        >
          <div className="flex flex-col items-center justify-center space-y-8 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              transition={{ 
                duration: 0.6,
                ease: "easeOut"
              }}
              className="relative"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-primary/20 rounded-lg blur-xl"
              />
              <Image 
                src="/logo-transparent.svg" 
                alt="AGFE Logo" 
                width={200} 
                height={60}
                className="object-contain relative z-10"
                priority
              />
            </motion.div>

            {/* Loading text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h2 className="font-just-another-hand text-4xl md:text-5xl text-white mb-2">
                Loading Your Guide...
              </h2>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-secondary text-lg"
              >
                Preparing everything for you
              </motion.div>
            </motion.div>           
             <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Loader2 className="w-12 h-12 text-primary" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-12 flex flex-col items-center space-y-4"
            >
              <p className="text-white/60 text-sm text-center max-w-md">
                Follow the development journey and get updates on new features
              </p>
              <motion.a
                href={github_url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
              >
                <Github className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">View on GitHub</span>
                <ExternalLink className="w-3 h-3 text-white/70" />
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ 
            opacity: 0,
            scale: 1.05
          }}
          animate={{ 
            opacity: 1,
            scale: 1
          }}
          transition={{ 
            duration: 0.6,
            ease: "easeOut"
          }}
        >
          {mounted && (isMobile ? <MobileLayout /> : <DesktopLayout />)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
