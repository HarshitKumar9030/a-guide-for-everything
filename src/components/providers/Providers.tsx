'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { GuideProvider, useGuide } from '@/contexts/GuideContext';
import { AnimatePresence } from 'framer-motion';
import GuideLoading from '@/components/core/GuideLoading';

interface ProvidersProps {
  children: ReactNode;
}

function AppContent({ children }: { children: ReactNode }) {
  const { guideState } = useGuide();

  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {guideState.isGenerating && (
          <GuideLoading 
            key="global-guide-loading"
            prompt={guideState.prompt} 
            model={guideState.model} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <GuideProvider>
        <AppContent>
          {children}
        </AppContent>
      </GuideProvider>
    </SessionProvider>
  );
}
