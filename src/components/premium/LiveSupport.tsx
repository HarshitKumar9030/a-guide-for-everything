'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Crown, Send, X, Minimize2, Maximize2, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'support';
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

interface LiveSupportProps {
  userPlan: 'free' | 'pro' | 'proplus';
}

export default function LiveSupport({ userPlan }: LiveSupportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [supportOnline, setSupportOnline] = useState(false);

  const hasLiveSupport = userPlan === 'proplus';
  const hasEmailSupport = userPlan === 'pro' || userPlan === 'proplus';

  useEffect(() => {
    // Check support availability
    checkSupportStatus();
    
    if (hasLiveSupport) {
      // Load chat history
      loadChatHistory();
    }
  }, [hasLiveSupport]);

  const checkSupportStatus = async () => {
    try {
      const response = await fetch('/api/support/status');
      if (response.ok) {
        const data = await response.json();
        setSupportOnline(data.online);
      }
    } catch (error) {
      console.error('Error checking support status:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/support/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !hasLiveSupport) return;

    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        // Simulate support response (in real app, this would come via WebSocket)
        setTimeout(() => {
          const supportMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'support',
            content: "Thanks for your message! Our team will respond shortly.",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, supportMessage]);
          setIsTyping(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  const startEmailSupport = () => {
    window.location.href = 'mailto:support@agfe.ai?subject=Support Request';
  };

  if (!hasEmailSupport) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-[#2A2A2A] rounded-2xl p-4 border border-[#323232] shadow-xl max-w-sm">
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <span className="text-white font-semibold">Support</span>
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <p className="text-gray-400 text-sm mb-3">
            Get help when you need it. Email support available with Pro, live chat with Pro+.
          </p>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="w-full bg-primary hover:bg-primary/80 text-black px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            Upgrade for Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Support Widget Trigger */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary/80 text-black rounded-full shadow-xl flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
          {hasLiveSupport && supportOnline && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          )}
        </motion.button>
      )}

      {/* Support Chat Window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            height: isMinimized ? 'auto' : '500px'
          }}
          className="fixed bottom-6 right-6 z-50 w-80 bg-[#1E1E1E] rounded-2xl border border-[#323232] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#2A2A2A] p-4 border-b border-[#323232]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {hasLiveSupport ? 'Live Support' : 'Support'}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {hasLiveSupport ? (
                      supportOnline ? '🟢 Online' : '🔴 Offline'
                    ) : (
                      'Email support available'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-[#323232] rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-[#323232] rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {hasLiveSupport ? (
                <>
                  {/* Chat Messages */}
                  <div className="h-80 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-400 mt-8">
                        <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <p>Start a conversation with our support team!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.type === 'support' && (
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-black" />
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              message.type === 'user'
                                ? 'bg-primary text-black'
                                : 'bg-[#2A2A2A] text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          {message.type === 'user' && (
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-black" />
                        </div>
                        <div className="bg-[#2A2A2A] p-3 rounded-2xl">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-[#323232]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#2A2A2A] text-white rounded-xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-primary hover:bg-primary/80 text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h4 className="text-white font-semibold mb-2">Email Support</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Get help via email with your Pro plan. For live chat, upgrade to Pro+.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={startEmailSupport}
                      className="w-full bg-primary hover:bg-primary/80 text-black px-4 py-2 rounded-xl font-semibold transition-colors"
                    >
                      Send Email
                    </button>
                    <button
                      onClick={() => window.location.href = '/pricing'}
                      className="w-full bg-[#2A2A2A] hover:bg-[#323232] text-white px-4 py-2 rounded-xl transition-colors text-sm"
                    >
                      Upgrade for Live Chat
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </>
  );
}
