'use client';
import React, { useState, useEffect } from 'react';

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
    const [isShimmering, setIsShimmering] = useState(false);    useEffect(() => {
        if (isActive) {
            console.log('Shimmer component activated, duration:', duration);
            setIsShimmering(true);
            const timer = setTimeout(() => {
                console.log('Shimmer component deactivated');
                setIsShimmering(false);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isActive, duration]);

    console.log('Shimmer render - isActive:', isActive, 'isShimmering:', isShimmering);

    return (
        <div className={`relative overflow-hidden rounded-xl ${className}`}>
            {children}
            {isShimmering && (
                <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden z-10">
                    <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/80 to-transparent"
                        style={{
                            animation: 'shimmerGlow 2s ease-out',
                            animationFillMode: 'forwards'
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
}

// Hook to trigger shimmer programmatically
export function useShimmer(triggerValue?: unknown) {
    const [shimmerActive, setShimmerActive] = useState(false);

    useEffect(() => {        // Always trigger on any change, no skipping
        if (triggerValue !== undefined && triggerValue !== 0) {
            console.log('Shimmer FORCE triggered by change:', triggerValue);
            setShimmerActive(true);
            const timer = setTimeout(() => {
                console.log('Shimmer hook deactivated');
                setShimmerActive(false);
            }, 2200); // Match CSS animation duration + buffer

            return () => clearTimeout(timer);
        }
    }, [triggerValue]);

    return shimmerActive;
}
