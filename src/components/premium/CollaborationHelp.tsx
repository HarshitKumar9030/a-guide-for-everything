'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  Users, 
  Edit3, 
  MessageSquare, 
  Share2,
  Eye,
  Sparkles,
  Keyboard,
  Clock
} from 'lucide-react';

interface CollaborationHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaborationHelp({ isOpen, onClose }: CollaborationHelpProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'features' | 'shortcuts'>('basics');

  const helpSections = {
    basics: {
      title: 'Collaboration Basics',
      icon: Users,
      content: [
        {
          title: 'Real-time Editing',
          description: 'Multiple team members can edit the same guide simultaneously. Changes are synchronized instantly across all connected users.',
          icon: Edit3
        },
        {
          title: 'User Presence',
          description: 'See who else is currently editing the guide. User avatars appear in the top-right corner showing active collaborators.',
          icon: Eye
        },
        {
          title: 'Live Cursors',
          description: 'Watch other users\' cursor positions and selections in real-time as they navigate through the document.',
          icon: MessageSquare
        },
        {
          title: 'Auto-Save',
          description: 'Your changes are automatically saved as you type. No need to manually save your work.',
          icon: Clock
        }
      ]
    },
    features: {
      title: 'Advanced Features',
      icon: Sparkles,
      content: [
        {
          title: 'AI Writing Assistant',
          description: 'Use AI to help write, improve, or complete your content. Click the AI button and describe what you want to add.',
          icon: Sparkles
        },
        {
          title: 'Team Sharing',
          description: 'Invite team members via email or share a link. Team members can join and collaborate on your guides.',
          icon: Share2
        },
        {
          title: 'Version History',
          description: 'Undo and redo changes. The editor maintains a history of changes so you can revert if needed.',
          icon: Clock
        },
        {
          title: 'Rich Formatting',
          description: 'Use the toolbar to format text with bold, italic, lists, quotes, and code blocks.',
          icon: Edit3
        }
      ]
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      icon: Keyboard,
      content: [
        {
          title: 'Ctrl + B',
          description: 'Make selected text bold',
          icon: Keyboard
        },
        {
          title: 'Ctrl + I',
          description: 'Make selected text italic',
          icon: Keyboard
        },
        {
          title: 'Ctrl + Z',
          description: 'Undo last change',
          icon: Keyboard
        },
        {
          title: 'Ctrl + Y',
          description: 'Redo last undone change',
          icon: Keyboard
        },
        {
          title: 'Ctrl + S',
          description: 'Save guide (auto-save is enabled)',
          icon: Keyboard
        },
        {
          title: 'Ctrl + /',
          description: 'Show/hide this help dialog',
          icon: Keyboard
        }
      ]
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#2A2A2A] rounded-2xl border border-[#323232] max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#323232]">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-white">Collaboration Guide</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#323232] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#323232]">
              {Object.entries(helpSections).map(([key, section]) => {
                const Icon = section.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as 'basics' | 'features' | 'shortcuts')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 transition-colors ${
                      activeTab === key
                        ? 'bg-primary/10 text-primary border-b-2 border-primary'
                        : 'text-gray-400 hover:text-white hover:bg-[#323232]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-6">
                {helpSections[activeTab].content.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 p-4 bg-[#1E1E1E] rounded-xl border border-[#323232]"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#323232] bg-[#1E1E1E]">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Need more help? Contact support from the dashboard.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#323232] hover:bg-[#404040] text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
