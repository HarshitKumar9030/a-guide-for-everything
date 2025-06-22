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
    BarChart3
} from 'lucide-react';
import { SavedGuide } from '@/lib/guides-db';

export default function SavedGuidesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [guides, setGuides] = useState<SavedGuide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (status === 'loading') return;
        
        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchGuides();
    }, [session, status, router]);

    const fetchGuides = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/guides');
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
    };

    const copyShareLink = async (guideId: string, isPublic: boolean) => {
        if (!isPublic) {
            alert('Guide must be public to be shared. Please make it public first.');
            return;
        }

        const shareUrl = `${window.location.origin}/guide/${guideId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            console.log('Share link copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-[#272727] text-white flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <p className="text-white/70">Loading your guides...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="min-h-screen bg-[#272727] text-white"
        >
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Your Saved Guides</h1>
                    <p className="text-white/70">
                        Manage your saved guides, toggle privacy settings, and share with others.
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-600/20 border border-red-600/50 rounded-xl p-4 mb-6"
                    >
                        <p className="text-red-300">{error}</p>
                    </motion.div>
                )}

                {guides.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16"
                    >
                        <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white/80 mb-2">No guides saved yet</h2>
                        <p className="text-white/60 mb-6">
                            Create and save your first guide to see it here.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/')}
                            className="bg-primary text-black px-6 py-3 rounded-xl font-medium hover:bg-primary/80 transition-colors"
                        >
                            Create Your First Guide
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence mode="popLayout">
                            {guides.map((guide, index) => (
                                <motion.div
                                    key={guide.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
                                >
                                    {/* Guide Header */}
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                                            {guide.title}
                                        </h3>
                                        <p className="text-white/60 text-sm line-clamp-2">
                                            {guide.nutshell || guide.prompt}
                                        </p>
                                    </div>

                                    {/* Guide Metadata */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-white/50">
                                            <User className="w-3 h-3" />
                                            <span>Model: {guide.model}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-white/50">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(guide.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {guide.tokens && (
                                            <div className="flex items-center gap-2 text-xs text-white/50">
                                                <BarChart3 className="w-3 h-3" />
                                                <span>{guide.tokens.total} tokens</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Privacy Status */}
                                    <div className="flex items-center gap-2 mb-4">
                                        {guide.isPublic ? (
                                            <div className="flex items-center gap-1 text-green-400 text-xs">
                                                <Globe className="w-3 h-3" />
                                                <span>Public</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-yellow-400 text-xs">
                                                <Lock className="w-3 h-3" />
                                                <span>Private</span>
                                            </div>
                                        )}
                                        {guide.views !== undefined && (
                                            <div className="text-white/50 text-xs">
                                                • {guide.views} views
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => openGuide(guide.id)}
                                                className="flex-1 bg-primary text-black py-2 px-3 rounded-lg text-xs font-medium hover:bg-primary/80 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Open
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => copyShareLink(guide.id, guide.isPublic)}
                                                disabled={!guide.isPublic}
                                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                                                    guide.isPublic
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                                                }`}
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Share
                                            </motion.button>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => togglePrivacy(guide.id, guide.isPublic)}
                                                className="flex-1 bg-white/10 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-1"
                                            >
                                                {guide.isPublic ? (
                                                    <>
                                                        <EyeOff className="w-3 h-3" />
                                                        Make Private
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-3 h-3" />
                                                        Make Public
                                                    </>
                                                )}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => deleteGuide(guide.id)}
                                                className="bg-red-600/20 text-red-400 py-2 px-3 rounded-lg text-xs font-medium hover:bg-red-600/30 transition-colors flex items-center justify-center"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </motion.div>
    );
}
