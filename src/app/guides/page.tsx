'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Plus,
  FileText,
  Clock,
  Users,
  Search,
  ArrowLeft,
  Edit3,
  Trash2,
  Crown,
  Maximize2,
  Eye,
  Share2,
  Tag
} from 'lucide-react';
import CollaborativeEditor from '@/components/premium/CollaborativeEditor';

interface Guide {
  _id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  tags: string[];
  collaborative: boolean;
}

interface UserPlan {
  plan: 'free' | 'pro' | 'proplus';
}

export default function GuidesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [collaborativeGuides, setCollaborativeGuides] = useState<Guide[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [editingGuide, setEditingGuide] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [userPlan, setUserPlan] = useState<UserPlan>({ plan: 'free' });
  const [fullScreenEditor, setFullScreenEditor] = useState(false);

  // Utility functions
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const processMarkdownDescription = (content: string) => {
    try {
      // Remove markdown syntax and get plain text for description
      const plainText = content
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/>\s+/g, '') // Remove blockquotes
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
      
      return plainText;
    } catch (error) {
      return content;
    }
  };

  const renderMarkdownPreview = (content: string, maxLength = 100) => {
    const plainText = processMarkdownDescription(content);
    return truncateText(plainText, maxLength);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setUserPlan({ plan: data.subscription?.plan || 'free' });
        }
      } catch (_error) {
        console.error('Error fetching user plan:', _error);
      }
    };

    const fetchGuides = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/guides');
        if (response.ok) {
          const data = await response.json();
          setGuides(data.guides || []);
        }
      } catch (_error) {
        console.error('Error fetching guides:', _error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCollaborativeGuides = async () => {
      try {
        const response = await fetch('/api/guides/collaborative');
        if (response.ok) {
          const data = await response.json();
          setCollaborativeGuides(data.guides || []);
        }
      } catch (_error) {
        console.error('Error fetching collaborative guides:', _error);
      }
    };

    const fetchFolders = async () => {
      try {
        const response = await fetch('/api/folders');
        if (response.ok) {
          const data = await response.json();
          setFolders(data.folders || []);
        }
      } catch (_error) {
        console.error('Error fetching folders:', _error);
      }
    };

    if (session?.user?.id) {
      fetchUserPlan();
      fetchGuides();
      fetchFolders();
      fetchCollaborativeGuides(); // Fetch collaborative guides for all users
    }
  }, [session, userPlan.plan]);

  const handleCreateGuide = async (collaborative = false) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Guide',
          content: '',
          isPublic: false,
          collaborative: collaborative && userPlan.plan === 'proplus'
        })
      });

      if (response.ok) {
        const newGuide = await response.json();
        setGuides(prev => [newGuide, ...prev]);
        setSelectedGuide(newGuide);
        setEditingGuide(newGuide._id);
      }
    } catch (error) {
      console.error('Error creating guide:', error);
    }
  };

  const handleSaveGuide = async (content: string) => {
    if (!selectedGuide) return;

    try {
      const response = await fetch(`/api/guides/${selectedGuide._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const updatedGuide = await response.json();
        setGuides(prev => prev.map(g => g._id === updatedGuide._id ? updatedGuide : g));
        setSelectedGuide(updatedGuide);
      }
    } catch (error) {
      console.error('Error saving guide:', error);
    }
  };

  const handleDeleteGuide = async (guideId: string) => {
    try {
      const response = await fetch(`/api/guides/${guideId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setGuides(prev => prev.filter(g => g._id !== guideId));
        if (selectedGuide?._id === guideId) {
          setSelectedGuide(null);
          setEditingGuide(null);
        }
      }
    } catch (error) {
      console.error('Error deleting guide:', error);
    }
  };

  const filteredGuides = [...guides, ...collaborativeGuides].filter((guide, index, self) => {
    // Remove duplicates based on _id
    const isUnique = self.findIndex(g => g._id === guide._id) === index;
    if (!isUnique) return false;
    
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTag === 'all' || 
                         (filterTag === 'collaborative' && guide.collaborative) ||
                         (filterTag === 'public' && guide.isPublic) ||
                         (filterTag === 'private' && !guide.isPublic);
    return matchesSearch && matchesFilter;
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141414] to-[#1E1E1E] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-cyan-400/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </motion.button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-white font-just-another-hand text-[64px] md:text-[96px] leading-none mb-2">
                  My Guides
                </h1>
                <p className="text-white/70 text-lg">
                  Create, edit, and collaborate on your guides
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <motion.button
                  onClick={() => handleCreateGuide(false)}
                  className="px-6 py-3 bg-primary text-black rounded-xl font-semibold hover:bg-primary/80 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                  New Guide
                </motion.button>
                
                {userPlan.plan === 'proplus' && (
                  <motion.button
                    onClick={() => handleCreateGuide(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Crown className="w-5 h-5" />
                    Collaborative
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Collaboration Help Banner */}
          {userPlan.plan === 'proplus' && !editingGuide && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-purple-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Real-time Collaboration Available
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Create collaborative guides that your team can edit together in real-time. 
                    Invite team members, see live cursors, and use AI assistance.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Edit3 className="w-4 h-4 text-purple-400" />
                      <span>Real-time editing</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span>Live user presence</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Crown className="w-4 h-4 text-purple-400" />
                      <span>AI writing assistance</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <motion.button
                      onClick={() => handleCreateGuide(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Create Collaborative Guide
                    </motion.button>
                    <motion.button
                      onClick={() => router.push('/dashboard')}
                      className="px-4 py-2 bg-[#323232] text-white rounded-lg hover:bg-[#404040] transition-colors text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Manage Team
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Guides List */}
            <div className="xl:col-span-1 space-y-6">
              {/* Search and Filter */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/10"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search guides..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#1E1E1E] text-white rounded-xl border border-white/10 focus:border-primary focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={filterTag}
                      onChange={(e) => setFilterTag(e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#1E1E1E] text-white rounded-lg border border-white/10 focus:border-primary focus:outline-none"
                    >
                      <option value="all">All Guides</option>
                      <option value="collaborative">Collaborative</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Guides List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/10 max-h-[600px] overflow-y-auto"
              >
                <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  Your Guides ({filteredGuides.length})
                </h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredGuides.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium mb-2">No guides found</p>
                    <p className="text-gray-500 text-sm">Create your first guide to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGuides.map((guide, index) => (
                      <motion.div
                        key={guide._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-primary/30 ${
                          selectedGuide?._id === guide._id
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-[#1E1E1E] border-white/5'
                        }`}
                        onClick={() => setSelectedGuide(guide)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium mb-2 truncate pr-2">
                              {truncateText(guide.title, 40)}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2 flex-wrap">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {new Date(guide.updatedAt).toLocaleDateString()}
                              </span>
                              {guide.collaborative && (
                                <>
                                  <Users className="w-4 h-4 ml-2 flex-shrink-0" />
                                  <span className="whitespace-nowrap">Collaborative</span>
                                </>
                              )}
                              {guide.isPublic && (
                                <>
                                  <Eye className="w-4 h-4 ml-2 flex-shrink-0" />
                                  <span className="whitespace-nowrap">Public</span>
                                </>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2 break-words">
                              {renderMarkdownPreview(guide.content, 120)}
                            </p>
                            {guide.tags && guide.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-2 flex-wrap">
                                <Tag className="w-3 h-3 text-gray-500" />
                                {guide.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg"
                                  >
                                    {truncateText(tag, 15)}
                                  </span>
                                ))}
                                {guide.tags.length > 3 && (
                                  <span className="text-gray-500 text-xs">+{guide.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGuide(guide);
                                setFullScreenEditor(true);
                                setEditingGuide(guide._id);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Full-screen editor"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGuide(guide);
                                setEditingGuide(guide._id);
                              }}
                              className="p-2 text-gray-400 hover:text-primary transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            {guide.isPublic && (
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(`${window.location.origin}/guides/${guide._id}`);
                                }}
                                className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </motion.button>
                            )}
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this guide?')) {
                                  handleDeleteGuide(guide._id);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Editor */}
            <div className="xl:col-span-2">
              {selectedGuide ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {editingGuide === selectedGuide._id ? (
                    <CollaborativeEditor
                      guideId={selectedGuide._id}
                      initialContent={selectedGuide.content}
                      onSave={handleSaveGuide}
                      userPlan={userPlan.plan === 'proplus' ? 'pro+' : userPlan.plan}
                    />
                  ) : (
                    <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-white text-2xl font-semibold">{selectedGuide.title}</h2>
                        <motion.button
                          onClick={() => setEditingGuide(selectedGuide._id)}
                          className="px-4 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-primary/80 transition-colors flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </motion.button>
                      </div>
                      
                      <div className="prose prose-invert max-w-none">
                        <div className="text-white whitespace-pre-wrap">
                          {selectedGuide.content || 'This guide is empty. Click Edit to start writing.'}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#2A2A2A] rounded-2xl p-12 border border-white/10 text-center"
                >
                  <FileText className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-white text-2xl font-semibold mb-4">Select a Guide</h3>
                  <p className="text-gray-400 mb-6">
                    Choose a guide from the list to view or edit it, or create a new one to get started.
                  </p>
                  <motion.button
                    onClick={() => handleCreateGuide(false)}
                    className="px-8 py-3 bg-primary text-black rounded-xl font-semibold hover:bg-primary/80 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Create Your First Guide
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Editor Modal */}
      {fullScreenEditor && selectedGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#141414] z-50 flex flex-col"
        >
          {/* Full-Screen Editor Header */}
          <div className="flex items-center justify-between p-4 bg-[#1E1E1E] border-b border-white/10">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => setFullScreenEditor(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h2 className="text-white text-xl font-semibold truncate max-w-md">
                {truncateText(selectedGuide.title, 50)}
              </h2>
              {selectedGuide.collaborative && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  <Users className="w-4 h-4" />
                  Collaborative
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                Last saved: {new Date(selectedGuide.updatedAt).toLocaleTimeString()}
              </div>
              <motion.button
                onClick={() => {
                  if (selectedGuide.isPublic) {
                    navigator.clipboard.writeText(`${window.location.origin}/guides/${selectedGuide._id}`);
                  }
                }}
                disabled={!selectedGuide.isPublic}
                className={`p-2 rounded-lg transition-colors ${
                  selectedGuide.isPublic 
                    ? 'text-gray-400 hover:text-green-400 hover:bg-white/10' 
                    : 'text-gray-600 cursor-not-allowed'
                }`}
                whileHover={selectedGuide.isPublic ? { scale: 1.1 } : {}}
                whileTap={selectedGuide.isPublic ? { scale: 0.9 } : {}}
                title={selectedGuide.isPublic ? "Copy share link" : "Guide is private"}
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Full-Screen Editor Content */}
          <div className="flex-1 overflow-hidden">
            <CollaborativeEditor
              guideId={selectedGuide._id}
              initialContent={selectedGuide.content}
              onSave={handleSaveGuide}
              userPlan={userPlan.plan === 'proplus' ? 'pro+' : userPlan.plan}
              fullScreen={true}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
