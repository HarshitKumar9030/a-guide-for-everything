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
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative w-[90vw] max-w-5xl overflow-hidden rounded-[72px]"
                        style={{
                            aspectRatio: '1241/711',
                            maxHeight: '80vh'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute inset-0 bg-[#1E1E1E]" />

                        {/* Left side - Gradient background */}
                        <div className="absolute inset-y-0 left-0 w-[50%] rounded-l-[72px] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1BE1FF] to-[#B3FFCC]" />
                        </div>

                        {/* Close button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 cursor-pointer z-20 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X
                                className="w-6 h-6 md:w-8 md:h-8 text-white"
                                strokeWidth={2}
                            />
                        </motion.button>            {/* Left side - Illustration */}
                        <div className="absolute inset-y-0 left-0 w-[50%] flex items-center justify-center z-10">
                            <Image
                                src="./login-illustration.svg"
                                alt="Login required illustration"
                                width={400}
                                height={320}
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Right side - Content */}
                        <div className="absolute inset-y-0 right-0 w-[50%] flex flex-col items-center justify-center p-4 md:p-8 z-10">
                            <div
                                className="font-just-another-hand text-white text-center mb-2"
                                style={{
                                    fontSize: 'clamp(48px, 6vw, 96px)',
                                    lineHeight: '1',
                                }}
                            >
                                Uh Oh
                            </div>

                            <p className="text-[#A2A2A2] text-center mb-4 text-sm md:text-base">
                                You can&apos;t use that yet!
                            </p>

                            <div className="flex flex-col items-center">
                                <p className="text-[#A2A2A2] text-lg md:text-xl mb-6 text-center">
                                    Please <span className="text-[#1BE1FF]">Login</span>
                                </p>                                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1"
                                    >
                                        <Link
                                            href="/auth/signup"
                                            className="w-full bg-[#272727] hover:bg-[#323232] border border-[#323232] rounded-2xl py-4 px-8 flex items-center justify-center text-white transition-colors text-sm md:text-base font-medium"
                                        >
                                            Register
                                        </Link>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1"
                                    >
                                        <Link
                                            href="/auth/signin"
                                            className="w-full bg-[#272727] hover:bg-[#323232] border border-[#323232] rounded-2xl py-4 px-8 flex items-center justify-center text-white transition-colors text-sm md:text-base font-medium"
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