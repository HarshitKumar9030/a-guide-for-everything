'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    Eye,
    EyeOff,
    ExternalLink,
    Trash2,
    Calendar,
    User,
    Globe,
    Lock,
    BarChart3,
    ArrowLeft,
    Copy,
    Plus
} from 'lucide-react';
import { SavedGuide } from '@/lib/guides-db';
import ErrorModal from '@/components/core/ErrorModal';

export default function SavedGuidesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [guides, setGuides] = useState<SavedGuide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Error modal state
    const [errorModal, setErrorModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'error' | 'success' | 'info' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchGuides();
    }, [session, status, router]);    const fetchGuides = async () => {
        try {
            setLoading(true);
            
            // Add minimum loading time to prevent flashing
            const [response] = await Promise.all([
                fetch('/api/guides'),
                new Promise(resolve => setTimeout(resolve, 800)) // Minimum 800ms loading
            ]);
            
            const data = await response.json();

            if (response.ok) {
                setGuides(data.guides || []);
            } else {
                setError(data.error || 'Failed to fetch guides');
            }
        } catch (error) {
            console.error('Error fetching guides:', error);
            setError('Failed to fetch guides');
        } finally {
            setLoading(false);
        }
    };

    const togglePrivacy = async (guideId: string, currentPrivacy: boolean) => {
        try {
            const response = await fetch(`/api/guides/${guideId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isPublic: !currentPrivacy
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setGuides(prev => prev.map(guide =>
                    guide.id === guideId
                        ? { ...guide, isPublic: !currentPrivacy }
                        : guide
                ));
            } else {
                console.error('Failed to update privacy:', result.error);
            }
        } catch (error) {
            console.error('Error updating privacy:', error);
        }
    };

    const deleteGuide = async (guideId: string) => {
        if (!confirm('Are you sure you want to delete this guide? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/guides/${guideId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
                setGuides(prev => prev.filter(guide => guide.id !== guideId));
            } else {
                console.error('Failed to delete guide:', result.error);
            }
        } catch (error) {
            console.error('Error deleting guide:', error);
        }
    };

    const openGuide = (guideId: string) => {
        router.push(`/guide/${guideId}`);
    }; const copyShareLink = async (guideId: string, isPublic: boolean) => {
        if (!isPublic) {
            setErrorModal({
                isOpen: true,
                title: 'Guide Not Public',
                message: 'This guide must be public before it can be shared. Please make it public first and try again.',
                type: 'warning'
            });
            return;
        }

        const shareUrl = `${window.location.origin}/guide/${guideId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setErrorModal({
                isOpen: true,
                title: 'Link Copied',
                message: 'Share link has been copied to your clipboard!',
                type: 'success'
            });
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            setErrorModal({
                isOpen: true,
                title: 'Copy Failed',
                message: 'Failed to copy the link to clipboard. Please try again.',
                type: 'error'
            });
        }    }; if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-7xl bg-[#1E1E1E] rounded-[72px] overflow-hidden shadow-xl">
                    <div className="p-8 md:p-12 lg:p-16">
                        <div className="text-center py-20">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                            <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
                            <p className="text-white/60">Please wait while we check your authentication.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!session) {
        router.push('/auth/signin');
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-7xl bg-[#1E1E1E] rounded-[72px] overflow-hidden shadow-xl">
                    <div className="p-8 md:p-12 lg:p-16">
                        <div className="text-center py-20">
                            <h2 className="text-2xl font-bold text-white mb-2">Redirecting...</h2>
                            <p className="text-white/60">Taking you to the sign-in page.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
                <div className="w-full max-w-7xl bg-[#1E1E1E] rounded-[72px] overflow-hidden shadow-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="p-8 md:p-12 lg:p-16"
                    >
                        <div className="mb-12">
                            <h1 className="text-white font-just-another-hand text-[96px] md:text-[128px] leading-none mb-4">
                                Saved Guides
                            </h1>
                            {/* <p className="text-white/60 text-xl max-w-2xl">
                                Loading your saved guides...
                            </p> */}
                        </div>

                        <div className="text-center py-20">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl w-32 h-32 mx-auto"></div>
                                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto relative"></div>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Loading Your Guides</h2>
                            <p className="text-white/60 text-lg max-w-md mx-auto">
                                Fetching your saved guides. This should only take a moment...
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    } return (
        <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="w-full max-w-7xl bg-[#1E1E1E] rounded-[72px] overflow-hidden shadow-xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="p-8 md:p-12 lg:p-16"
                >
                    <div className="mb-12">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors mb-8"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to Home</span>
                        </motion.button>

                        <h1 className="text-white font-just-another-hand text-[96px] md:text-[128px] leading-none mb-4">
                            Saved Guides
                        </h1>
                        <p className="text-white/60 text-xl max-w-2xl">
                            Manage your saved guides, toggle privacy settings, and share with others.
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-600/20 border border-red-600/30 rounded-2xl p-6 mb-8"
                        >
                            <p className="text-red-300 text-lg">{error}</p>
                        </motion.div>
                    )}

                    {guides.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl w-32 h-32 mx-auto"></div>
                                <BookOpen className="w-20 h-20 text-primary/50 mx-auto relative" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">No guides saved yet</h2>
                            <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
                                Create and save your first guide to see it here. Your saved guides will appear as beautiful cards.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/')}
                                className="bg-primary text-black px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-primary/80 transition-colors flex items-center gap-3 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                Create Your First Guide
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                            <AnimatePresence mode="popLayout">
                                {guides.map((guide, index) => (
                                    <motion.div
                                        key={guide.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="bg-[#2A2A2A] border border-white/10 rounded-3xl p-8 hover:border-primary/30 hover:bg-[#2A2A2A]/80 transition-all duration-300 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="relative z-10">
                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight">
                                                    {guide.title}
                                                </h3>
                                                <p className="text-white/60 text-sm line-clamp-3 leading-relaxed">
                                                    {guide.nutshell || guide.prompt}
                                                </p>
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center gap-3 text-sm text-white/50">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        <span>{guide.model}</span>
                                                    </div>
                                                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{new Date(guide.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                {guide.tokens && (
                                                    <div className="flex items-center gap-2 text-sm text-white/50">
                                                        <BarChart3 className="w-4 h-4" />
                                                        <span>{guide.tokens.total.toLocaleString()} tokens</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    {guide.isPublic ? (
                                                        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                                                            <Globe className="w-4 h-4" />
                                                            <span className="font-medium">Public</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/20">
                                                            <Lock className="w-4 h-4" />
                                                            <span className="font-medium">Private</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {guide.views !== undefined && (
                                                    <div className="text-white/50 text-sm">
                                                        {guide.views} views
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex gap-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => openGuide(guide.id)}
                                                        className="flex-1 bg-primary text-black py-3 px-4 rounded-xl font-semibold hover:bg-primary/80 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Open Guide
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => copyShareLink(guide.id, guide.isPublic)}
                                                        className={`px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center ${guide.isPublic
                                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                : 'bg-white/10 text-white/50 cursor-not-allowed hover:bg-white/15'
                                                            }`}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </motion.button>
                                                </div>

                                                <div className="flex gap-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => togglePrivacy(guide.id, guide.isPublic)}
                                                        className="flex-1 bg-white/10 text-white py-3 px-4 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {guide.isPublic ? (
                                                            <>
                                                                <EyeOff className="w-4 h-4" />
                                                                Make Private
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="w-4 h-4" />
                                                                Make Public
                                                            </>
                                                        )}
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => deleteGuide(guide.id)}
                                                        className="bg-red-600/20 text-red-400 py-3 px-4 rounded-xl font-medium hover:bg-red-600/30 transition-colors flex items-center justify-center border border-red-500/20"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    <ErrorModal
                        isOpen={errorModal.isOpen}
                        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
                        title={errorModal.title}
                        message={errorModal.message}
                        type={errorModal.type}
                    />
                </motion.div>
            </div>
        </div>
    );
}
