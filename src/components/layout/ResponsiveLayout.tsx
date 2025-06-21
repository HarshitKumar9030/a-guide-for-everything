'use client';

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';

export default function ResponsiveLayout() {
  const { isMobile } = useResponsive();

  // Show loading state on initial render to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full bg-primary cyan-dot"></div>
      </div>
    );
  }

  return (
    <>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </>
  );
}
