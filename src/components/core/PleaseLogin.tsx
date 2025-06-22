'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';

interface PleaseLoginProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PleaseLogin({ isOpen, onClose }: PleaseLoginProps) {
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
                >                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative w-[95vw] sm:w-[90vw] max-w-5xl overflow-hidden rounded-2xl sm:rounded-[32px] md:rounded-[48px] lg:rounded-[72px]"
                        style={{
                            aspectRatio: '1241/711',
                            maxHeight: '85vh'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute inset-0 bg-[#1E1E1E]" />                        {/* Left side - Gradient background */}
                        <div className="absolute inset-y-0 left-0 w-[45%] sm:w-[50%] rounded-l-2xl sm:rounded-l-[32px] md:rounded-l-[48px] lg:rounded-l-[72px] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1BE1FF] to-[#B3FFCC]" />
                        </div>                     
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 cursor-pointer z-20 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X
                                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white"
                                strokeWidth={2}
                            />
                        </motion.button>           
                        <div className="absolute inset-y-0 left-0 w-[45%] sm:w-[50%] flex items-center justify-center z-10">
                            <Image
                                src="./login-illustration.svg"
                                alt="Login required illustration"
                                width={400}
                                height={320}
                                className="object-contain w-[80%] sm:w-[85%] md:w-[90%] lg:w-full"
                                priority
                            />
                        </div>

                        <div className="absolute inset-y-0 right-0 w-[55%] sm:w-[50%] flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 z-10">                            <div
                                className="font-just-another-hand text-white text-center mb-1 sm:mb-2"
                                style={{
                                    fontSize: 'clamp(32px, 8vw, 96px)',
                                    lineHeight: '1',
                                }}
                            >
                                Uh Oh
                            </div>

                            <p className="text-[#A2A2A2] text-center mb-2 sm:mb-4 text-xs sm:text-sm md:text-base">
                                You can&apos;t use that yet!
                            </p>

                            <div className="flex flex-col items-center w-full">
                                <p className="text-[#A2A2A2] text-base sm:text-lg md:text-xl mb-3 sm:mb-4 md:mb-6 text-center">
                                    Please <span className="text-[#1BE1FF]">Login</span>
                                </p>

                                <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-xs sm:max-w-sm md:max-w-md">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full"
                                    >
                                        <Link
                                            href="/auth/signup"
                                            className="w-full bg-[#272727] hover:bg-[#323232] border border-[#323232] rounded-xl sm:rounded-2xl py-2.5 sm:py-3 md:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center text-white transition-colors text-xs sm:text-sm md:text-base font-medium"
                                        >
                                            Register
                                        </Link>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full"
                                    >
                                        <Link
                                            href="/auth/signin"
                                            className="w-full bg-[#272727] hover:bg-[#323232] border border-[#323232] rounded-xl sm:rounded-2xl py-2.5 sm:py-3 md:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center text-white transition-colors text-xs sm:text-sm md:text-base font-medium"
                                        >
                                            Login
                                        </Link>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}