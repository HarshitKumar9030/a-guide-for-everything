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
                        
                        <div className="absolute inset-x-0 top-0 h-[72%] rounded-t-[72px] overflow-hidden">
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
                        </div>
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
                        </motion.button>
                          {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 z-10">
                            <div
                                className="font-just-another-hand text-white text-center mb-4 md:mb-8"
                                style={{
                                    fontSize: 'clamp(64px, 8vw, 128px)',
                                    lineHeight: '1',
                                }}
                            >
                                Coming Soon
                            </div>

                            <div
                                className="text-center max-w-lg md:max-w-2xl px-4 mb-8"
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 'clamp(16px, 2vw, 24px)',
                                    lineHeight: '1.2',
                                    color: '#272727',
                                }}
                            >
                                <span className="italic">{feature}</span> aren&apos;t supported just yet, rest assured, I am working constantly to integrate it asap.
                            </div>

                            <div className="mt-auto mb-6 flex flex-col items-center">
                                <p className="text-white/80 text-sm md:text-base mb-3 text-center">
                                    Keep a watch on GitHub for updates
                                </p>
                                <motion.a
                                    href={github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                                >
                                    <Github className="w-5 h-5 text-white" />
                                    <span className="text-white font-medium">View Project</span>
                                    <ExternalLink className="w-4 h-4 text-white/70" />
                                </motion.a>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}