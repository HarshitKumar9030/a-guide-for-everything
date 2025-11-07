'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Search, 
    Filter, 
    Calendar, 
    User, 
    Eye, 
    Globe, 
    BookOpen, 
    ArrowLeft,
    Clock,
    ExternalLink,
    Copy,
    SortAsc,
    SortDesc,
    Loader2
} from 'lucide-react';
import ErrorModal from '@/components/core/ErrorModal';

interface SearchResult {
    _id: string;
    title: string;
    preview: string;
    content: string;
    model: string;
    author: {
        name: string;
        email?: string;
    };
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
    views: number;
    relevanceScore?: number;
    highlightedTitle?: string;
    highlightedPreview?: string;
}

interface SearchFilters {
    model: string;
    dateRange: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

interface SearchResponse {
    success: boolean;
    data?: {
        results: SearchResult[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalResults: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
        query: {
            q: string;
            model?: string;
            dateRange?: string;
            sortBy: string;
            sortOrder: string;
        };
    };
    error?: string;
}

const MODELS = [
    'All Models',
    'gemini-2.5-flash',
    'kimi',
    'kimi0905',
    'qwen3-32b',
    'gpt-oss-20b',
    'gpt-oss-120b',
    'deepseek-r1-free',
    'gpt-4.1',
    'gpt-4.1-mini',
    'o3-mini'
];

const DATE_RANGES = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 24 Hours', value: '1d' },
    { label: 'Last Week', value: '7d' },
    { label: 'Last Month', value: '30d' },
    { label: 'Last 3 Months', value: '90d' }
];

const SORT_OPTIONS = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Date Created', value: 'date' },
    { label: 'Title', value: 'title' },
    { label: 'Views', value: 'views' }
];

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTime, setSearchTime] = useState<number>(0);
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        hasNext: false,
        hasPrev: false
    });
    
    const [filters, setFilters] = useState<SearchFilters>({
        model: searchParams.get('model') || 'All Models',
        dateRange: searchParams.get('dateRange') || 'all',
        sortBy: searchParams.get('sortBy') || 'relevance',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    });

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

    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const performSearch = useCallback(async (query: string, currentFilters: SearchFilters, page = 1) => {
        if (!query.trim() || query.length < 2) {
            setResults([]);
            setPagination({
                currentPage: 1,
                totalPages: 0,
                totalResults: 0,
                hasNext: false,
                hasPrev: false
            });
            return;
        }

        setLoading(true);
        const startTime = Date.now();

        try {
            const params = new URLSearchParams({
                q: query,
                page: page.toString(),
                limit: '12',
                sortBy: currentFilters.sortBy,
                sortOrder: currentFilters.sortOrder,
            });

            if (currentFilters.model !== 'All Models') {
                params.append('model', currentFilters.model);
            }

            if (currentFilters.dateRange !== 'all') {
                params.append('dateRange', currentFilters.dateRange);
            }

            const response = await fetch(`/api/search/guides?${params}`);
            const data: SearchResponse = await response.json();

            if (response.ok && data.success && data.data) {
                setResults(data.data.results);
                setPagination(data.data.pagination);
                setSearchTime(Date.now() - startTime);
            } else {
                setErrorModal({
                    isOpen: true,
                    title: 'Search Failed',
                    message: data.error || 'Failed to search guides. Please try again.',
                    type: 'error'
                });
                setResults([]);
                setPagination({
                    currentPage: 1,
                    totalPages: 0,
                    totalResults: 0,
                    hasNext: false,
                    hasPrev: false
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            setErrorModal({
                isOpen: true,
                title: 'Search Error',
                message: 'An error occurred while searching. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedSearch = useCallback(
        (query: string, currentFilters: SearchFilters) => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            const timeout = setTimeout(() => {
                performSearch(query, currentFilters);
            }, 500);

            setSearchTimeout(timeout);
        },
        [performSearch, searchTimeout]
    );

    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            setSearchQuery(query);
            performSearch(query, filters);
        }
    }, [searchParams, filters, performSearch]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        debouncedSearch(value, filters);
    };

    const handleFilterChange = (key: keyof SearchFilters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        
        if (searchQuery.trim()) {
            performSearch(searchQuery, newFilters);
        }
    };

    const handlePageChange = (page: number) => {
        if (searchQuery.trim()) {
            performSearch(searchQuery, filters, page);
        }
    };

    const copyShareLink = async (guideId: string) => {
        const shareUrl = `${window.location.origin}/guide/${guideId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setErrorModal({
                isOpen: true,
                title: 'Link Copied',
                message: 'Guide link has been copied to your clipboard!',
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
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-12"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium text-white">Back to Home</span>
                    </motion.button>

                    <h1 className="text-white font-just-another-hand text-[96px] md:text-[128px] leading-none mb-4">
                        Search Guides
                    </h1>
                    <p className="text-white/60 text-xl max-w-2xl">
                        Discover and explore public guides from the community. Find exactly what you&apos;re looking for with powerful search and filters.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 mb-8"
                >
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search for guides, topics, or content..."
                                className="w-full bg-[#2A2A2A] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-white/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-6 py-4 bg-[#2A2A2A] border border-white/10 rounded-2xl text-white hover:bg-[#333333] transition-colors"
                        >
                            <Filter className="w-5 h-5" />
                            <span>Filters</span>
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-6 pt-6 border-t border-white/10"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-white/70 text-sm font-medium mb-2">Model</label>
                                        <select
                                            value={filters.model}
                                            onChange={(e) => handleFilterChange('model', e.target.value)}
                                            className="w-full bg-[#2A2A2A] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                                        >
                                            {MODELS.map(model => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-white/70 text-sm font-medium mb-2">Date Range</label>
                                        <select
                                            value={filters.dateRange}
                                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                            className="w-full bg-[#2A2A2A] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                                        >
                                            {DATE_RANGES.map(range => (
                                                <option key={range.value} value={range.value}>{range.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-white/70 text-sm font-medium mb-2">Sort By</label>
                                        <select
                                            value={filters.sortBy}
                                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                            className="w-full bg-[#2A2A2A] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                                        >
                                            {SORT_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-white/70 text-sm font-medium mb-2">Order</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleFilterChange('sortOrder', 'desc')}
                                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                                                    filters.sortOrder === 'desc'
                                                        ? 'bg-primary text-black'
                                                        : 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                                                }`}
                                            >
                                                <SortDesc className="w-4 h-4" />
                                                <span className="text-sm">Desc</span>
                                            </button>
                                            <button
                                                onClick={() => handleFilterChange('sortOrder', 'asc')}
                                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                                                    filters.sortOrder === 'asc'
                                                        ? 'bg-primary text-black'
                                                        : 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                                                }`}
                                            >
                                                <SortAsc className="w-4 h-4" />
                                                <span className="text-sm">Asc</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-20"
                        >
                            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
                            <p className="text-white/60 text-lg">Searching guides...</p>
                        </motion.div>
                    ) : !searchQuery.trim() ? (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-20"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/14 rounded-full blur-3xl w-32 h-32 mx-auto"></div>
                                <BookOpen className="w-20 h-20 text-primary mx-auto relative" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Start Your Search</h2>
                            <p className="text-white/60 text-lg max-w-md mx-auto">
                                Enter a search term above to find guides from the community. Use filters to narrow down your results.
                            </p>
                        </motion.div>
                    ) : results.length === 0 ? (
                        <motion.div
                            key="no-results"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-center py-20"
                        >
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/14 rounded-full blur-3xl w-32 h-32 mx-auto"></div>
                                <Search className="w-20 h-20 text-primary mx-auto relative" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">No results found</h2>
                            <p className="text-white/60 text-lg max-w-md mx-auto mb-6">
                                We couldn&apos;t find any guides matching &quot;{searchQuery}&quot;. Try adjusting your search terms or filters.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setSearchQuery('');
                                    setResults([]);
                                }}
                                className="bg-primary text-black px-6 py-3 rounded-xl font-semibold hover:bg-primary/80 transition-colors"
                            >
                                Clear Search
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <p className="text-white/60">
                                        {pagination.totalResults} result{pagination.totalResults !== 1 ? 's' : ''} found
                                    </p>
                                    {searchTime > 0 && (
                                        <div className="flex items-center gap-1 text-white/40 text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>{searchTime}ms</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                <AnimatePresence mode="popLayout">
                                    {results.map((guide, index) => (
                                        <motion.div
                                            key={guide._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-6 hover:border-primary/30 hover:bg-[#1E1E1E]/80 transition-all duration-300 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                            <div className="relative z-10">
                                                <div className="mb-4">
                                                    <h3 
                                                        className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight"
                                                        dangerouslySetInnerHTML={{
                                                            __html: guide.highlightedTitle || guide.title
                                                        }}
                                                    />
                                                    <p 
                                                        className="text-white/60 text-sm line-clamp-3 leading-relaxed"
                                                        dangerouslySetInnerHTML={{
                                                            __html: guide.highlightedPreview || guide.preview
                                                        }}
                                                    />
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-3 text-sm text-white/50">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4" />
                                                            <span>{guide.author.name}</span>
                                                        </div>
                                                        <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                                                        <div className="flex items-center gap-2">
                                                            <span>{guide.model}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-white/50">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{formatDate(guide.createdAt)}</span>
                                                        </div>
                                                        <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                                                        <div className="flex items-center gap-2">
                                                            <Eye className="w-4 h-4" />
                                                            <span>{guide.views} views</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                                                        <Globe className="w-4 h-4" />
                                                        <span className="font-medium">Public</span>
                                                    </div>
                                                    {guide.relevanceScore !== undefined && (
                                                        <div className="text-white/50 text-sm">
                                                            {Math.round(guide.relevanceScore * 10) / 10} relevance
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => router.push(`/guide/${guide._id}`)}
                                                        className="flex-1 bg-primary text-black py-3 px-4 rounded-xl font-semibold hover:bg-primary/80 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        View Guide
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => copyShareLink(guide._id)}
                                                        className="px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {pagination.totalPages > 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center justify-center gap-2 mt-12"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={!pagination.hasPrev}
                                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                                            pagination.hasPrev
                                                ? 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                                                : 'bg-[#1E1E1E] text-white/30 cursor-not-allowed'
                                        }`}
                                    >
                                        Previous
                                    </motion.button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = pagination.currentPage - 2 + i;
                                            }

                                            return (
                                                <motion.button
                                                    key={pageNum}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                                                        pageNum === pagination.currentPage
                                                            ? 'bg-primary text-black'
                                                            : 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={!pagination.hasNext}
                                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                                            pagination.hasNext
                                                ? 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                                                : 'bg-[#1E1E1E] text-white/30 cursor-not-allowed'
                                        }`}
                                    >
                                        Next
                                    </motion.button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <ErrorModal
                    isOpen={errorModal.isOpen}
                    onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
                    title={errorModal.title}
                    message={errorModal.message}
                    type={errorModal.type}
                />
            </div>
        </div>
    );
}
