'use client';

import { useState, useEffect, useMemo } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

const defaultBreakpoints: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

export function useResponsive(customBreakpoints?: Partial<ResponsiveBreakpoints>) {
  const breakpoints = useMemo(
    () => ({ ...defaultBreakpoints, ...customBreakpoints }),
    [customBreakpoints]
  );
  
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      if (width < breakpoints.mobile) {
        setDeviceType('mobile');
      } else if (width < breakpoints.tablet) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    }

    // Set initial values
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  return {
    deviceType,
    windowSize,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isMobileOrTablet: deviceType === 'mobile' || deviceType === 'tablet',
    breakpoints,
  };
}

// Utility function for conditional classes
export function responsiveClass(
  mobile: string,
  desktop: string,
  deviceType: DeviceType
): string {
  return deviceType === 'mobile' ? mobile : desktop;
}

// Utility for conditional rendering
export function renderResponsive<T>(
  mobile: T,
  desktop: T,
  deviceType: DeviceType
): T {
  return deviceType === 'mobile' ? mobile : desktop;
}
