'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Download, Share2, ArrowLeft, ZoomIn, ZoomOut, List, BookOpen, Copy, ExternalLink, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import { GuideStorage, GuideData } from '@/lib/guide-storage';
import { useGuide } from '@/contexts/GuideContext';
import PleaseLogin from '@/components/core/PleaseLogin';
import '@/styles/guide.css';

const cleanMarkdownContent = (content: string) => {
    let cleaned = content.replace(/^#\s+.+$/m, '');
    
    cleaned = cleaned.replace(/##\s*In a Nutshell\s*\n[\s\S]*?(?=\n#|$)/i, '');
    
    cleaned = cleaned.replace(/^\s*\n+/, '').trim();
    
    return cleaned;
};

const extractHeadings = (content: string) => {
    const cleanedContent = cleanMarkdownContent(content);

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: { id: string; text: string; level: number }[] = [];
    let match;

    while ((match = headingRegex.exec(cleanedContent)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        headings.push({ id, text, level });
    }

    return headings;
};

const generateNutshellSummary = (content: string) => {
    const nutshellMatch = content.match(/##\s*In a Nutshell\s*\n([\s\S]*?)(?=\n#|$)/i);
    if (nutshellMatch) {
        return nutshellMatch[1].trim().replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    }

    const plainText = content
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1');

    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');
};

export default function GuidePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { finishGeneration } = useGuide();
    const [guideData, setGuideData] = useState<GuideData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [shareableLink, setShareableLink] = useState<string>('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);    const [showTOC, setShowTOC] = useState(false);
    const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
    const [nutshellSummary, setNutshellSummary] = useState<string>('');
    const [isSaved, setIsSaved] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    useEffect(() => {
        const data = GuideStorage.getGuide();
        if (data) {
            setGuideData(data);

            const extractedHeadings = extractHeadings(data.guide);
            setHeadings(extractedHeadings);

            const summary = generateNutshellSummary(data.guide);
            setNutshellSummary(summary);

            setTimeout(() => {
                finishGeneration();
            }, 500);
        } else {
            router.push('/');
        }    }, [router, finishGeneration]);

    const zoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
    const zoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 70));

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setShowTOC(false);
        }
    };    const handleSave = async () => {
        if (!guideData) return;

        if (!session) {
            setShowLoginModal(true);
            return;
        }

        setIsSaving(true);
        try {
            const title = guideData.guide.match(/^#\s+(.+)$/m)?.[1] || guideData.originalPrompt;
            
            const response = await fetch('/api/guides', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content: guideData.guide,
                    nutshell: nutshellSummary,
                    model: guideData.model,
                    prompt: guideData.originalPrompt,
                    tokens: guideData.tokens,
                    isPublic: false // Default to private
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSaveStatus('success');
                setIsSaved(true);
                if (result.shareUrl) {
                    setShareableLink(result.shareUrl);
                    setShowShareModal(true);
                    console.log('Guide saved! Shareable link:', result.shareUrl);
                }
            } else {
                console.error('Save failed:', result.error);
                setSaveStatus('error');
            }
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Failed to save guide:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Link copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const handleCloseShareModal = () => {
        setShowShareModal(false);
        setShareableLink('');
    };

    const handleDownload = () => {
        if (!guideData) return;

        const content = `# Guide: ${guideData.originalPrompt}\n\nGenerated by: ${guideData.model}\nCreated: ${new Date(guideData.timestamp).toLocaleString()}\n\n---\n\n${guideData.guide}`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guide-${guideData.originalPrompt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };    const handleShare = async () => {
        if (!guideData) return;

        if (!isSaved || !shareableLink) {
            return; // Button should be disabled, but just in case
        }

        try {
            if (typeof navigator !== 'undefined' && 'share' in navigator) {
                await navigator.share({
                    title: `Guide: ${guideData.originalPrompt}`,
                    text: nutshellSummary || guideData.guide.substring(0, 200) + '...',
                    url: shareableLink
                });
            } else {
                // Fallback: copy link to clipboard
                await copyToClipboard(shareableLink);
                alert('Share link copied to clipboard!');
            }
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };if (!guideData) {
        return null; // Let the GuideLoading screen handle the loading state
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="min-h-screen bg-[#272727] text-white"
        ><div className="fixed bottom-4 right-4 z-20 flex flex-col gap-2">
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={zoomOut}
                        className="mobile-fab flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1E1E1E] hover:bg-[#333] border border-white/10 transition-colors shadow-lg backdrop-blur-sm touch-manipulation"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    <div className="mobile-fab flex items-center justify-center w-12 h-10 sm:w-16 sm:h-12 rounded-xl bg-[#1E1E1E] border border-white/10 text-xs sm:text-sm font-medium">
                        {zoomLevel}%
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={zoomIn}
                        className="mobile-fab flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1E1E1E] hover:bg-[#333] border border-white/10 transition-colors shadow-lg backdrop-blur-sm touch-manipulation"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTOC(!showTOC)}
                    className={`mobile-fab flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm shadow-lg backdrop-blur-sm touch-manipulation min-w-0 ${showTOC
                        ? 'bg-primary text-black border border-primary/30'
                        : 'bg-[#1E1E1E] hover:bg-[#333] border border-white/10'
                        }`}
                >
                    <List className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline whitespace-nowrap">Contents</span>
                    <span className="xs:hidden sm:hidden">TOC</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="mobile-fab flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-[#1E1E1E] hover:bg-[#333] border border-white/10 transition-colors text-xs sm:text-sm shadow-lg backdrop-blur-sm touch-manipulation"
                >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline whitespace-nowrap">Download</span>
                    <span className="xs:hidden sm:hidden">Download</span>
                </motion.button>                {typeof window !== 'undefined' && 'share' in navigator && (
                    <motion.button
                        whileHover={{ scale: isSaved ? 1.05 : 1 }}
                        whileTap={{ scale: isSaved ? 0.95 : 1 }}
                        onClick={isSaved ? handleShare : undefined}
                        disabled={!isSaved}
                        className={`mobile-fab flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm shadow-lg backdrop-blur-sm touch-manipulation ${
                            isSaved 
                                ? 'bg-[#1E1E1E] hover:bg-[#333] border border-white/10' 
                                : 'bg-gray-600 text-gray-400 border border-gray-500 cursor-not-allowed'
                        }`}
                        title={!isSaved ? 'Save guide first to share' : 'Share guide'}
                    >
                        <Share2 className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden xs:inline sm:inline whitespace-nowrap">
                            {isSaved ? 'Share' : 'Save to Share'}
                        </span>
                        <span className="xs:hidden sm:hidden">
                            {isSaved ? 'Share' : 'Save'}
                        </span>
                    </motion.button>
                )}                <motion.button
                    whileHover={{ scale: !session ? 1 : 1.05 }}
                    whileTap={{ scale: !session ? 1 : 0.95 }}
                    onClick={!session ? () => setShowLoginModal(true) : handleSave}
                    disabled={isSaving}
                    className={`mobile-fab flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm font-medium shadow-lg backdrop-blur-sm touch-manipulation ${
                        !session 
                            ? 'bg-gray-600 text-gray-400 border border-gray-500 cursor-pointer'
                            : saveStatus === 'success'
                                ? 'bg-green-600 text-white border border-green-500'
                                : saveStatus === 'error'
                                    ? 'bg-red-600 text-white border border-red-500'
                                    : 'bg-primary text-black hover:bg-primary/80 border border-primary/30'
                        }`}
                    title={!session ? 'Sign in to save guides' : ''}
                >
                    {!session ? (
                        <Save className="w-4 h-4 flex-shrink-0" />
                    ) : isSaving ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full flex-shrink-0"
                        />
                    ) : (
                        <Save className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="hidden xs:inline sm:inline whitespace-nowrap">
                        {!session 
                            ? 'Sign in to Save' 
                            : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'
                        }
                    </span>
                    <span className="xs:hidden sm:hidden">
                        {!session 
                            ? 'Sign in' 
                            : saveStatus === 'success' ? 'OK' : saveStatus === 'error' ? 'Err' : 'Save'
                        }
                    </span>
                </motion.button>
            </div>

            <AnimatePresence>
                {showTOC && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-30"
                            onClick={() => setShowTOC(false)}
                        />                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[#1E1E1E] border-l border-white/10 z-40 overflow-x-hidden"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(27, 225, 255, 0.5) rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <style jsx>{`
                                .custom-scrollbar::-webkit-scrollbar {
                                    width: 8px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-track {
                                    background: rgba(255, 255, 255, 0.05);
                                    border-radius: 4px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb {
                                    background: linear-gradient(180deg, rgba(27, 225, 255, 0.8) 0%, rgba(27, 225, 255, 0.4) 100%);
                                    border-radius: 4px;
                                    border: 1px solid rgba(27, 225, 255, 0.2);
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                    background: linear-gradient(180deg, rgba(27, 225, 255, 1) 0%, rgba(27, 225, 255, 0.6) 100%);
                                }
                            `}</style>

                            <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Table of Contents</h3>
                                            <p className="text-primary/80 text-sm">Navigate sections</p>
                                        </div>
                                        <button
                                            onClick={() => setShowTOC(false)}
                                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <nav className="space-y-1">
                                        {headings.map((heading, index) => (
                                            <motion.button
                                                key={index}
                                                whileHover={{ x: 4 }}
                                                onClick={() => scrollToHeading(heading.id)}
                                                className={`block w-full text-left p-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 transition-all group border border-transparent hover:border-primary/20 ${heading.level === 1 ? 'text-white font-semibold bg-white/5' :
                                                    heading.level === 2 ? 'text-white/85 ml-4 font-medium' :
                                                        'text-white/70 ml-8'
                                                    }`}
                                                style={{ fontSize: heading.level === 1 ? '15px' : heading.level === 2 ? '14px' : '13px' }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full transition-all  ${heading.level === 1 ? 'bg-primary' :
                                                        heading.level === 2 ? 'bg-primary/70' :
                                                            'bg-primary/40'
                                                        }`}></div>
                                                    <span className="group-hover:text-primary/90 transition-colors">
                                                        {heading.text}
                                                    </span>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="border-b border-dashed border-white/10 bg-[#272727]"
            >
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </motion.button>          <div className="flex items-start gap-3 mb-6">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                                {guideData.originalPrompt}
                            </h1>
                            <p className="text-white/60 text-lg">
                                Your comprehensive AI Generated guide
                            </p>
                        </div>
                    </div>
                    <div className="bg-[#1E1E1E] rounded-xl p-4 border border-white/10">
                        <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-primary">Model:</span>
                                <span className="text-white">{guideData.model}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-medium text-primary">Generated:</span>
                                <span className="text-white">
                                    {new Date(guideData.timestamp).toLocaleDateString()} at{' '}
                                    {new Date(guideData.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-medium text-primary">Created by:</span>
                                <span className="text-white">{guideData.user || 'Guest'}</span>
                            </div>

                            {guideData.tokens && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-primary">Tokens:</span>
                                    <span className="text-white">
                                        {guideData.tokens.total.toLocaleString()} ({guideData.tokens.input.toLocaleString()} in / {guideData.tokens.output.toLocaleString()} out)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.header>
            <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
                {nutshellSummary && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="relative overflow-hidden rounded-2xl mb-8"
                    >
                        <div className="absolute inset-0 bg-background"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                        <div className="absolute inset-0 rounded-2xl border border-primary/30 shadow-[0_0_20px_rgba(27,225,255,0.1)]"></div>

                        <div className="relative p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">In a Nutshell</h2>
                                    <p className="text-primary/80 text-sm font-medium">Quick overview</p>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                                <p className="text-white/90 leading-relaxed text-lg font-medium">
                                    {nutshellSummary}
                                </p>
                            </div>

                            <div className="absolute top-4 right-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-4 left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                        </div>
                    </motion.div>
                )}<motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-hidden"
                >
                    <div
                        className="p-8 lg:p-12 origin-top-left"
                        style={{
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: 'top left',
                            transition: 'transform 0.3s ease',
                            width: `${10000 / zoomLevel}%`
                        }}
                    >                        <div className="prose prose-invert prose-lg max-w-none guide-content">              <ReactMarkdown
                        components={{
                            h1: ({ children }) => {
                                const text = children?.toString() || '';
                                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                return (
                                    <h1 id={id} className="text-3xl font-bold mb-8 text-white border-b border-white/20 pb-4 leading-tight">
                                        {children}
                                    </h1>
                                );
                            }, h2: ({ children }) => {
                                const text = children?.toString() || '';
                                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                                return (
                                    <h2 id={id} className="text-2xl font-semibold mt-12 mb-6 text-white leading-tight">
                                        {children}
                                    </h2>
                                );
                            },
                            h3: ({ children }) => {
                                const text = children?.toString() || '';
                                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                return (
                                    <h3 id={id} className="text-xl font-semibold mt-8 mb-4 text-white/95 leading-tight">
                                        {children}
                                    </h3>
                                );
                            }, p: ({ children }) => (
                                <p className="text-white/85 mb-6 leading-relaxed text-lg">
                                    {children}
                                </p>
                            ), ul: ({ children }) => (
                                <ul className="list-none mb-8 text-white/85 space-y-4">
                                    {children}
                                </ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-8 text-white/85 space-y-4 pl-4">
                                    {children}
                                </ol>
                            ),
                            li: ({ children }) => (
                                <li className="flex items-start gap-3 leading-relaxed">
                                    <span className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></span>
                                    <span className="flex-1 text-lg">{children}</span>
                                </li>
                            ), code: ({ children }) => (
                                <code className="bg-black/40 px-3 py-1.5 rounded-md text-primary font-mono text-sm border border-white/10">
                                    {children}
                                </code>
                            ),
                            pre: ({ children }) => (
                                <pre className="bg-black/50 p-6 rounded-xl overflow-x-auto mb-8 border border-white/10">
                                    <code className="text-white/90 font-mono text-sm leading-relaxed">
                                        {children}
                                    </code>
                                </pre>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-primary pl-6 py-4 italic text-white/80 my-8 bg-primary/5 rounded-r-lg">
                                    <div className="text-lg leading-relaxed">{children}</div>
                                </blockquote>
                            ),
                            strong: ({ children }) => (
                                <strong className="font-semibold text-white">
                                    {children}
                                </strong>
                            ),                        }}
                    >
                        {cleanMarkdownContent(guideData.guide)}
                    </ReactMarkdown>
                        </div>
                    </div>                </motion.div>

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 z-50"
                            onClick={handleCloseShareModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >                            <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                                        <Save className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">Guide Saved Successfully!</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Lock className="w-3 h-3 text-orange-400" />
                                            <span className="text-orange-400 text-xs font-medium">Private Guide</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-white/70 mb-4">
                                    Your guide has been saved as private and can be shared using the link below. 
                                    Visit your <span className="text-primary font-medium">Saved Guides</span> page to make it public.
                                </p>
                                
                                <div className="bg-black/30 border border-white/10 rounded-lg p-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={shareableLink}
                                            readOnly
                                            className="flex-1 bg-transparent text-white text-sm outline-none"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => copyToClipboard(shareableLink)}
                                            className="p-2 bg-primary text-black rounded-lg hover:bg-primary/80 transition-colors"
                                            title="Copy link"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>                                
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => window.open(shareableLink, '_blank')}
                                        className="flex-1 bg-primary text-black py-2.5 rounded-xl font-medium hover:bg-primary/80 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View Guide
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => router.push('/saved-guides')}
                                        className="flex-1 bg-white/10 text-white py-2.5 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Manage
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCloseShareModal}
                                        className="bg-white/10 text-white py-2.5 px-4 rounded-xl font-medium hover:bg-white/20 transition-colors"
                                    >
                                        Close
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>                    </>
                )}
            </AnimatePresence>

            <PleaseLogin
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />
            </main>
        </motion.div>
    );
}
