'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              duration: 0.2 
            }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-[#1E1E1E] rounded-3xl border border-[#323232] shadow-2xl max-w-md w-full p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {isDangerous && (
                    <div className="bg-red-500/20 rounded-full p-2">
                      <AlertTriangle size={24} className="text-red-500" />
                    </div>
                  )}
                  <h2 className="text-white text-2xl font-semibold">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 bg-[#2A2A2A] hover:bg-[#323232] text-white font-medium py-3 px-6 rounded-2xl border border-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 font-medium py-3 px-6 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDangerous
                      ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500'
                      : 'bg-primary hover:bg-primary/90 text-black border border-primary'
                  }`}
                >
                  {isLoading ? 'Processing...' : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
