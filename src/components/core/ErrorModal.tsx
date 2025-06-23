'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  actionText?: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'error',
  actionText = 'OK'
}: ErrorModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className="text-green-500" />;
      case 'info':
        return <Info size={24} className="text-blue-500" />;
      case 'warning':
        return <Clock size={24} className="text-yellow-500" />;
      default:
        return <AlertTriangle size={24} className="text-red-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          iconBg: 'bg-green-500/20',
          button: 'bg-green-600 hover:bg-green-700 text-white border border-green-500'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-500/20',
          button: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-500/20',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white border border-yellow-500'
        };
      default:
        return {
          iconBg: 'bg-red-500/20',
          button: 'bg-red-600 hover:bg-red-700 text-white border border-red-500'
        };
    }
  };

  const colors = getColors();

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
                  <div className={`${colors.iconBg} rounded-full p-2`}>
                    {getIcon()}
                  </div>
                  <h2 className="text-white text-2xl font-semibold">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-300 text-lg mb-8 leading-relaxed whitespace-pre-line">
                {message}
              </p>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className={`${colors.button} font-medium py-3 px-8 rounded-2xl transition-colors`}
                >
                  {actionText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
