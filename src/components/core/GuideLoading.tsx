'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface GuideLoadingProps {
  prompt: string;
  model: string;
}

export default function GuideLoading({ prompt, model }: GuideLoadingProps) {
  useEffect(() => {
    // Prevent scrolling when loading
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-[#141414] to-[#1E1E1E] backdrop-blur-sm"
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="font-just-another-hand text-4xl md:text-5xl text-white">
              Creating Your Guide
            </h2>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mb-4"
          >
            <p className="text-primary text-lg font-medium mb-2">&ldquo;{prompt}&rdquo;</p>
            <p className="text-secondary text-sm">Using {model}</p>
          </motion.div>

          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-secondary text-lg"
          >
            Generating comprehensive guide...
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col items-center space-y-6"
        >
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

        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="text-center"
        >
          <p className="text-white/60 text-sm max-w-md">
            Our AI is crafting a detailed, personalized guide just for you. This might take a moment...
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
