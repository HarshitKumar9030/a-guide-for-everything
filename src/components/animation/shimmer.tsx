'use client';
import React, { useState, useEffect, useRef } from 'react';

interface ShimmerProps {
    children: React.ReactNode;
    isActive?: boolean;
    duration?: number;
    className?: string;
}

export default function Shimmer({ 
    children, 
    isActive = false, 
    duration = 1000,
    className = ""
}: ShimmerProps) {
    const [isShimmering, setIsShimmering] = useState(false);

    useEffect(() => {
        if (isActive) {
            setIsShimmering(true);
            const timer = setTimeout(() => {
                setIsShimmering(false);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isActive, duration]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {children}
            {isShimmering && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
            )}
        </div>
    );
}

// Hook to trigger shimmer programmatically
export function useShimmer(triggerValue?: unknown) {
    const [shimmerActive, setShimmerActive] = useState(false);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip first render, only trigger on actual changes
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        setShimmerActive(true);
        const timer = setTimeout(() => {
            setShimmerActive(false);
        }, 200);

        return () => clearTimeout(timer);
    }, [triggerValue]);

    return shimmerActive;
}
