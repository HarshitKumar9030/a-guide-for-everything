'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, ExternalLink } from 'lucide-react';
import { github_url } from '../constants';

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: string;
}

export default function ComingSoonModal({ isOpen, onClose, feature }: ComingSoonModalProps) {
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
                        <div className="absolute inset-0 bg-[#1E1E1E]" />                        <div className="absolute inset-x-0 top-0 h-[72%] rounded-t-2xl sm:rounded-t-[32px] md:rounded-t-[48px] lg:rounded-t-[72px] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1BE1FF] to-[#B3FFCC]" />

                            {/* Curved bottom overlay */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-[30%]"
                                style={{
                                    background: '#1E1E1E',
                                    borderTopLeftRadius: '100%',
                                    borderTopRightRadius: '100%',
                                    transform: 'translateY(40%)'
                                }}
                            />
                        </div>                        <motion.button
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
                        </motion.button>                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 z-10">
                            <div
                                className="font-just-another-hand text-white text-center mb-2 sm:mb-4 md:mb-8"
                                style={{
                                    fontSize: 'clamp(48px, 10vw, 128px)',
                                    lineHeight: '1',
                                }}
                            >
                                Coming Soon
                            </div>

                            <div
                                className="text-center max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl px-2 sm:px-4 mb-4 sm:mb-6 md:mb-8"
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 'clamp(14px, 3vw, 24px)',
                                    lineHeight: '1.2',
                                    color: '#272727',
                                }}
                            >
                                <span className="italic">{feature}</span> aren&apos;t supported just yet, rest assured, I am working constantly to integrate it asap.
                            </div>

                            <div className="mt-auto mb-3 sm:mb-4 md:mb-6 flex flex-col items-center">
                                <p className="text-white/80 text-xs sm:text-sm md:text-base mb-2 sm:mb-3 text-center px-2">
                                    Keep a watch on GitHub for updates
                                </p>
                                <motion.a
                                    href={github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                                >
                                    <Github className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    <span className="text-white font-medium text-xs sm:text-sm md:text-base">View Project</span>
                                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
                                </motion.a>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}