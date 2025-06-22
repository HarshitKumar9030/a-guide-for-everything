'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GuideState {
  isGenerating: boolean;
  prompt: string;
  model: string;
  error: string | null;
  startTime: number | null;
}

interface GuideContextType {
  guideState: GuideState;
  startGeneration: (prompt: string, model: string) => void;
  finishGeneration: () => void;
  setError: (error: string) => void;
  clearError: () => void;
}

const GuideContext = createContext<GuideContextType | undefined>(undefined);

interface GuideProviderProps {
  children: ReactNode;
}

export function GuideProvider({ children }: GuideProviderProps) {  const [guideState, setGuideState] = useState<GuideState>({
    isGenerating: false,
    prompt: '',
    model: '',
    error: null,
    startTime: null,
  });

  const startGeneration = (prompt: string, model: string) => {
    setGuideState({
      isGenerating: true,
      prompt,
      model,
      error: null,
      startTime: Date.now(),
    });
  };

  const finishGeneration = () => {
    setGuideState(prev => {
      const now = Date.now();
      const elapsed = prev.startTime ? now - prev.startTime : 0;
      const minLoadingTime = 3000; // 3 seconds
      
      if (elapsed < minLoadingTime) {
        // If less than 3 seconds have passed, delay the finish
        setTimeout(() => {
          setGuideState(current => ({
            ...current,
            isGenerating: false,
          }));
        }, minLoadingTime - elapsed);
        
        return prev; // Don't change state yet
      } else {
        // More than 3 seconds have passed, finish immediately
        return {
          ...prev,
          isGenerating: false,
        };
      }
    });
  };
  const setError = (error: string) => {
    setGuideState(prev => ({
      ...prev,
      error,
      isGenerating: false,
      startTime: null,
    }));
  };

  const clearError = () => {
    setGuideState(prev => ({
      ...prev,
      error: null,
    }));
  };

  return (
    <GuideContext.Provider value={{
      guideState,
      startGeneration,
      finishGeneration,
      setError,
      clearError,
    }}>
      {children}
    </GuideContext.Provider>
  );
}

export function useGuide() {
  const context = useContext(GuideContext);
  if (context === undefined) {
    throw new Error('useGuide must be used within a GuideProvider');
  }
  return context;
}
