'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface PremiumUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel?: string;
}

export default function PremiumUpgradeModal({ 
    isOpen, 
    onClose, 
    currentModel = "this model"
}: PremiumUpgradeModalProps) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close modal on esc key press
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose]);

    const features = [
        {
            icon: <Sparkles className="w-5 h-5" />,
            title: "Premium AI Models",
            description: "Access GPT-4.1, O3 Mini, and other cutting-edge models"
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: "Higher Limits",
            description: "Generate more guides with Pro (20+ daily) or Pro+ (unlimited)"
        },
        {
            icon: <Crown className="w-5 h-5" />,
            title: "Priority Processing",
            description: "Skip the queue with faster generation times"
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative w-[95vw] sm:w-[90vw] max-w-md overflow-hidden rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute inset-0 bg-[#1E1E1E] border border-white/10" />
                        
                        {/* Close button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="absolute top-4 right-4 w-8 h-8 cursor-pointer z-20 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" strokeWidth={2} />
                        </motion.button>
                        
                        {/* Content */}
                        <div className="relative z-10 p-8 text-center">
                            {/* Crown icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="mx-auto mb-6 w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center"
                            >
                                <Crown className="w-8 h-8 text-primary" />
                            </motion.div>
                            
                            {/* Title */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                                className="mb-6"
                            >
                                <h2 className="text-white text-2xl font-bold mb-2">
                                    Upgrade to Pro or Pro+
                                </h2>
                                <p className="text-white/70 text-sm">
                                    {currentModel.includes('GPT-4.1') || currentModel.includes('O3') 
                                        ? `${currentModel} requires a premium subscription`
                                        : `You've reached your limit for ${currentModel}. Upgrade for more guides.`
                                    }
                                </p>
                            </motion.div>
                            
                            {/* Features */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                                className="space-y-3 mb-8"
                            >
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3 text-left">
                                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                                            <p className="text-white/60 text-xs">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                            
                            {/* Action buttons */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                                className="space-y-3"
                            >
                                <Link
                                    href="/pricing"
                                    className="w-full bg-primary hover:bg-primary/80 text-black font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Crown className="w-4 h-4" />
                                    <span>Upgrade Now</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                
                                <Link
                                    href="/pricing"
                                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 px-6 rounded-xl transition-colors text-center block"
                                >
                                    View Pricing
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
