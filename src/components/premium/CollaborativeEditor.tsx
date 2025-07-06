'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Save,
  Users,
  Crown,
  Sparkles,
  Send,
  Loader2,
  HelpCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import CollaborationHelp from './CollaborationHelp';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  cursor?: number;
  selection?: { start: number; end: number };
  lastSeen?: Date;
}

interface CollaborativeEditorProps {
  guideId: string;
  initialContent?: string;
  isReadOnly?: boolean;
  onSave?: (content: string) => void;
  userPlan?: 'free' | 'pro' | 'pro+';
  fullScreen?: boolean;
}

export default function CollaborativeEditor({
  guideId,
  initialContent = '',
  isReadOnly = false,
  onSave,
  userPlan = 'free',
  fullScreen = false
}: CollaborativeEditorProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState(initialContent);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiAssistant, setAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const versionRef = useRef(0);
  const lastChangeRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '/':
            e.preventDefault();
            setShowHelp(prev => !prev);
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'z':
            if (!e.shiftKey) {
              e.preventDefault();
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [content, undoStack, redoStack]);

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user?.email || !session?.user?.name) return;

    socketRef.current = io('http://localhost:3001', {
      query: {
        guideId,
        userId: session.user.email,
        userName: session.user.name,
        userImage: session.user.image || ''
      }
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('user-joined', (user: User) => {
      setConnectedUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    socketRef.current.on('user-left', (userId: string) => {
      setConnectedUsers(prev => prev.filter(u => u.id !== userId));
    });

    socketRef.current.on('content-changed', ({ content: newContent, version, userId }: { content: string; version: number; userId: string }) => {
      if (userId !== session.user.email && version > versionRef.current) {
        setContent(newContent);
        versionRef.current = version;
      }
    });

    socketRef.current.on('cursor-moved', ({ userId, cursor, selection }: { userId: string; cursor: number; selection?: { start: number; end: number } }) => {
      setConnectedUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, cursor, selection } : user
      ));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [session?.user?.email, session?.user?.name, session?.user?.image, guideId]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (isReadOnly) return;

    // Add to undo stack
    setUndoStack(prev => [...prev.slice(-19), content]);
    setRedoStack([]);

    setContent(newContent);
    versionRef.current += 1;

    // Debounce socket emission
    if (lastChangeRef.current) {
      clearTimeout(lastChangeRef.current);
    }

    lastChangeRef.current = setTimeout(() => {
      socketRef.current?.emit('content-change', {
        content: newContent,
        version: versionRef.current,
        guideId
      });
    }, 300);
  }, [content, guideId, isReadOnly]);

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (!textareaRef.current) return;

    const cursor = textareaRef.current.selectionStart;
    const selection = textareaRef.current.selectionStart !== textareaRef.current.selectionEnd
      ? { start: textareaRef.current.selectionStart, end: textareaRef.current.selectionEnd }
      : undefined;

    socketRef.current?.emit('cursor-move', {
      cursor,
      selection,
      guideId
    });
  }, [guideId]);

  // Undo/Redo functionality
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const previousContent = undoStack[undoStack.length - 1];
    setRedoStack(prev => [content, ...prev]);
    setUndoStack(prev => prev.slice(0, -1));
    setContent(previousContent);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const nextContent = redoStack[0];
    setUndoStack(prev => [...prev, content]);
    setRedoStack(prev => prev.slice(1));
    setContent(nextContent);
  };

  // Save functionality
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(content);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // AI Assistant (Pro+ only)
  const handleAIAssist = async () => {
    if (userPlan !== 'pro+' || !aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Help improve this guide content: "${content}"\n\nUser request: ${aiPrompt}`,
          context: 'collaborative-editor'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const improvedContent = data.response || content;
        handleContentChange(improvedContent);
        setAiPrompt('');
      }
    } catch (error) {
      console.error('AI assistance failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Text formatting functions
  const insertFormatting = (before: string, after: string = '') => {
    if (!textareaRef.current || isReadOnly) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    handleContentChange(newContent);

    // Set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }
    }, 0);
  };

  return (
    <div className="bg-[#1E1E1E] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-[#272727] p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-white text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Connected Users */}
            {connectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-white" />
                <div className="flex -space-x-2">
                  {connectedUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="w-8 h-8 rounded-full bg-[#333333] border-2 border-[#1E1E1E] flex items-center justify-center"
                      title={user.name}
                    >
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <span className="text-white text-xs">{user.name?.[0]}</span>
                      )}
                    </div>
                  ))}
                  {connectedUsers.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-[#333333] border-2 border-[#1E1E1E] flex items-center justify-center">
                      <span className="text-white text-xs">+{connectedUsers.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {userPlan === 'pro+' && (
              <motion.button
                onClick={() => setAiAssistant(!aiAssistant)}
                className={`p-2 rounded-lg transition-colors ${aiAssistant ? 'bg-purple-600 text-white' : 'bg-[#333333] text-white hover:bg-[#404040]'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="AI Assistant (Pro+ Only)"
              >
                <Sparkles size={16} />
              </motion.button>
            )}

            <motion.button
              onClick={handleSave}
              disabled={isSaving || isReadOnly}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {aiAssistant && userPlan === 'pro+' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-purple-950/30 border-b border-purple-500/30 p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Crown size={16} className="text-purple-400" />
            <span className="text-purple-400 font-medium">AI Assistant</span>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask AI to improve your content..."
              className="flex-1 bg-[#1E1E1E] text-white px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleAIAssist()}
            />
            <motion.button
              onClick={handleAIAssist}
              disabled={isGenerating || !aiPrompt.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Toolbar */}
      {!isReadOnly && (
        <div className="bg-[#272727] p-2 border-b border-white/10">
          <div className="flex items-center space-x-1">
            {/* Undo/Redo */}
            <motion.button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-2 text-white hover:bg-[#333333] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Undo"
            >
              <Undo size={16} />
            </motion.button>
            <motion.button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-2 text-white hover:bg-[#333333] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Redo"
            >
              <Redo size={16} />
            </motion.button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Text Formatting */}
            <motion.button
              onClick={() => insertFormatting('**', '**')}
              className="p-2 text-white hover:bg-[#333333] rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Bold"
            >
              <Bold size={16} />
            </motion.button>
            <motion.button
              onClick={() => insertFormatting('*', '*')}
              className="p-2 text-white hover:bg-[#333333] rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Italic"
            >
              <Italic size={16} />
            </motion.button>
            <motion.button
              onClick={() => insertFormatting('`', '`')}
              className="p-2 text-white hover:bg-[#333333] rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Code"
            >
              <Code size={16} />
            </motion.button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Lists */}
            <motion.button
              onClick={() => insertFormatting('\n- ')}
              className="p-2 text-white hover:bg-[#333333] rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Bullet List"
            >
              <List size={16} />
            </motion.button>
            <motion.button
              onClick={() => insertFormatting('\n1. ')}
              className="p-2 text-white hover:bg-[#333333] rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </motion.button>
            <motion.button
              onClick={() => insertFormatting('\n> ')}
              className="p-2 text-white hover:bg-[#333333] rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Quote"
            >
              <Quote size={16} />
            </motion.button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Help Button */}
            <motion.button
              onClick={() => setShowHelp(true)}
              className="p-2 text-white hover:bg-[#333333] rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Collaboration Help (Ctrl+/)"
            >
              <HelpCircle size={16} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onSelect={handleCursorChange}
          onKeyUp={handleCursorChange}
          placeholder={isReadOnly ? "This guide is read-only" : "Start writing your guide..."}
          className="w-full h-96 bg-transparent text-white p-4 resize-none focus:outline-none placeholder-gray-400"
          readOnly={isReadOnly}
        />

        {/* Cursor indicators for other users */}
        {connectedUsers.map((user) => {
          if (user.cursor === undefined) return null;
          
          return (
            <div
              key={user.id}
              className="absolute pointer-events-none"
              style={{
                left: '1rem',
                top: `${16 + (user.cursor / content.length) * 384}px` // Approximate position
              }}
            >
              <div className="w-0.5 h-4 bg-blue-500" />
              <div className="bg-blue-500 text-white text-xs px-1 rounded-sm whitespace-nowrap">
                {user.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collaboration Help Modal */}
      <CollaborationHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </div>
  );
}
