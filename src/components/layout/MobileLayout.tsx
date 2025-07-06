import React, { useState } from 'react';
import { Plus, ArrowUp, ChevronDown } from 'lucide-react';
// import Stars from '../core/Stars';
import CoolSquare from '../core/CoolSquare';
import ComingSoonModal from '../core/ComingSoonModal';
import PleaseLogin from '../core/PleaseLogin';
import PremiumUpgradeModal from '../core/PremiumUpgradeModal';
// import Footer from '../core/Footer';
import { DefaultTypewriterText } from '../animation/text';
import { ModelType, availableModels, updateSelectedModel } from './DesktopLayout';
import Shimmer, { useShimmer } from '../animation/shimmer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGuide } from '@/contexts/GuideContext';
import { GuideStorage } from '@/lib/guide-storage';

// Hook to manage user limits (same as DesktopLayout)
const useUserLimits = () => {
  const [limits, setLimits] = useState<{
    llamaGuides: number;
    geminiGuides: number;
    deepseekGuides: number;
    gpt41Guides: number;
    gpt41miniGuides: number;
    o3miniGuides: number;
    remaining: { llama: number; gemini: number; deepseek: number; gpt41: number; gpt41mini: number; o3mini: number };
    guestRemaining?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const fetchLimits = React.useCallback(async () => {
    if (!session) {
      // For guests, we'll track in localStorage as a simple fallback
      const guestCount = parseInt(localStorage.getItem('guest_guide_count') || '0');
      setLimits({
        llamaGuides: 0,
        geminiGuides: 0,
        deepseekGuides: 0,
        gpt41Guides: 0,
        gpt41miniGuides: 0,
        o3miniGuides: 0,
        remaining: { llama: 0, gemini: 0, deepseek: 0, gpt41: 0, gpt41mini: 0, o3mini: 0 },
        guestRemaining: Math.max(0, 3 - guestCount)
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/limits');
      if (response.ok) {
        const data = await response.json();
        setLimits(data);
      }
    } catch (error) {
      console.error('Failed to fetch user limits:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  React.useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  return { limits, loading, refetch: fetchLimits };
};

export default function MobileLayout() {
  const { data: session } = useSession();
  const router = useRouter();
  const { startGeneration, finishGeneration, setError } = useGuide();
  const [selectedModel, setSelectedModel] = useState<ModelType>('llama-4-hackclub'); // Default to Llama
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [isPleaseLoginModalOpen, setIsPleaseLoginModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [shimmerTrigger, setShimmerTrigger] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { limits, refetch } = useUserLimits();
  const shimmerActive = useShimmer(shimmerTrigger);

  // Set default model based on session status
  React.useEffect(() => {
    if (!session) {
      // For guests, always default to Llama
      setSelectedModel('llama-4-hackclub');
      updateSelectedModel('llama-4-hackclub');
    }
  }, [session]);
  const handleModelChange = (model: ModelType) => {
    // If guest user tries to select premium models, show login modal
    if (!session && model !== 'llama-4-hackclub' && model !== 'deepseek-r1-free') {
      setIsPleaseLoginModalOpen(true);
      setIsDropdownOpen(false);
      return;
    }

    setSelectedModel(model);
    updateSelectedModel(model);
    setIsDropdownOpen(false);

    // Explicitly trigger shimmer after model change
    setTimeout(() => {
      const newTrigger = Date.now();
      setShimmerTrigger(newTrigger);
    }, 150);
  };

  const handleInputClick = () => {
    setIsInputMode(true);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isGenerating) return;

    // Check guest limits if not logged in
    if (!session) {
      const guestCount = parseInt(localStorage.getItem('guest_guide_count') || '0');
      if (guestCount >= 3) {
        setError('You have reached your limit of 3 guides. Please sign in to generate more guides.');
        return;
      }

      // Ensure guests can only use Llama or DeepSeek
      // Ensure guests can only use Llama or DeepSeek
      if (selectedModel !== 'llama-4-hackclub' && selectedModel !== 'deepseek-r1-free') {
        setSelectedModel('llama-4-hackclub');
        updateSelectedModel('llama-4-hackclub');
      }
    } else {
      // Check if user has reached their limit for the selected model
      if (limits && isGenerationDisabled()) {
        setIsPremiumModalOpen(true);
        return;
      }
    }

    setIsGenerating(true);
    startGeneration(inputValue.trim(), selectedModel);

    try {
      const response = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputValue.trim(),
          model: selectedModel
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate guide');
      }

      // Update guest count if not logged in
      if (!session) {
        const newCount = parseInt(localStorage.getItem('guest_guide_count') || '0') + 1;
        localStorage.setItem('guest_guide_count', newCount.toString());
      }

      // Add token estimation
      const tokens = GuideStorage.estimateTokens(data.guide);
      const guideData = { ...data, tokens };

      // Store guide data and navigate to guide page
      GuideStorage.storeGuide(guideData);
      finishGeneration();
      setInputValue(''); // Clear input after successful generation

      // Refresh limits after successful generation
      if (session) {
        refetch();
      }

      router.push('/guide');
    } catch (error) {
      console.error('Error generating guide:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate guide');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentModel = availableModels.find(m => m.id === selectedModel);

  const _getRemainingCount = () => {
    if (!session) {
      const guestCount = parseInt(localStorage.getItem('guest_guide_count') || '0');
      return `${Math.max(0, 3 - guestCount)}/3`;
    }

    if (limits) {
      let current = 0;
      let max = 0;
      
      if (selectedModel === 'llama-4-hackclub') {
        current = limits.remaining.llama;
        max = 6;
      } else if (selectedModel === 'gemini-flash-2.5') {
        current = limits.remaining.gemini;
        max = 4;
      } else if (selectedModel === 'deepseek-r1-free') {
        current = limits.remaining.deepseek;
        max = 4;
      } else if (selectedModel === 'gpt-4.1') {
        current = limits.remaining.gpt41;
        max = 3;
      } else if (selectedModel === 'gpt-4.1-mini') {
        current = limits.remaining.gpt41mini;
        max = 3;
      } else if (selectedModel === 'o3-mini') {
        current = limits.remaining.o3mini;
        max = 2;
      }
      
      return `${current}/${max}`;
    }

    return '—';
  };

  const handleSubmitButtonClick = () => {
    if (!inputValue.trim() || isGenerating) return;
    
    // If user is not logged in and has reached guest limit, show login modal
    if (!session) {
      const guestCount = parseInt(localStorage.getItem('guest_guide_count') || '0');
      if (guestCount >= 3) {
        setIsPleaseLoginModalOpen(true);
        return;
      }
    }
    
    // If user is logged in but has reached their limit, show premium modal
    if (session && limits && isGenerationDisabled()) {
      setIsPremiumModalOpen(true);
      return;
    }
    
    // Otherwise, proceed with normal submission
    handleSubmit();
  };

  const isGenerationDisabled = () => {
    if (!inputValue.trim() || isGenerating) return true;

    if (!session) {
      const guestCount = parseInt(localStorage.getItem('guest_guide_count') || '0');
      return guestCount >= 3;
    }

    if (limits) {
      if (selectedModel === 'llama-4-hackclub') {
        return limits.remaining.llama <= 0;
      } else if (selectedModel === 'gemini-flash-2.5') {
        return limits.remaining.gemini <= 0;
      } else if (selectedModel === 'deepseek-r1-free') {
        return limits.remaining.deepseek <= 0;
      } else if (selectedModel === 'gpt-4.1') {
        return limits.remaining.gpt41 <= 0;
      } else if (selectedModel === 'gpt-4.1-mini') {
        return limits.remaining.gpt41mini <= 0;
      } else if (selectedModel === 'o3-mini') {
        return limits.remaining.o3mini <= 0;
      }
    }

    return false;
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.model-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]); return (
    <div className="min-h-screen w-screen bg-[#272727] relative overflow-hidden">
      <div className='fixed bottom-4 right-4 z-10'>
        <div className="bg-[#1E1E1E] border border-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              {!session ? (
                `${Math.max(0, 3 - parseInt(localStorage.getItem('guest_guide_count') || '0'))}/3 left`
              ) : limits ? (
                (() => {
                  let current = 0;
                  let max = 0;
                  
                  if (selectedModel === 'llama-4-hackclub') {
                    current = limits.remaining.llama;
                    max = 6;
                  } else if (selectedModel === 'gemini-flash-2.5') {
                    current = limits.remaining.gemini;
                    max = 4;
                  } else if (selectedModel === 'deepseek-r1-free') {
                    current = limits.remaining.deepseek;
                    max = 4;
                  } else if (selectedModel === 'gpt-4.1') {
                    current = limits.remaining.gpt41;
                    max = 3;
                  } else if (selectedModel === 'gpt-4.1-mini') {
                    current = limits.remaining.gpt41mini;
                    max = 3;
                  } else if (selectedModel === 'o3-mini') {
                    current = limits.remaining.o3mini;
                    max = 2;
                  }
                  
                  return `${current}/${max} left`;
                })()
              ) : (
                '— left'
              )}
            </span>
          </div>
        </div>
      </div>


      <div className="absolute top-[-63px] right-[0px]">
        <CoolSquare
          className=""
          size={180}
          lineThickness={1}
          lineStyle="dashed"
          circleSize={16}
          rotate={30}
        />
      </div>

      <div className="absolute bottom-[-63px] left-[-100px]">
        <CoolSquare
          className=""
          size={180}
          lineThickness={1}
          lineStyle="dashed"
          circleSize={16}
          rotate={30}
        />
      </div>

      <div className="flex flex-col justify-between h-screen p-4">
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="font-just-another-hand text-[64px] text-center leading-tight mb-4">
            A Guide For Everything
          </div>
          <div className="text-base text-secondary text-center px-4 mb-8">
            Smart guides powered by AI to help families coordinate schedules,
            manage shift work routines, plan meals, optimize sleep patterns, and
            maintain work-life balance across different shift rotations.
          </div>

          <div className="w-full max-w-md bg-[#1E1E1E] border border-white/10 h-40 rounded-2xl relative">
            <div className="flex h-full w-full flex-col justify-between">
              <div
                className="flex-1 p-4 relative cursor-text"
                onClick={handleInputClick}
              >
                {!isInputMode && inputValue === '' ? (
                  <div className="text-white text-base font-medium">
                    <DefaultTypewriterText />
                  </div>
                ) : (
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={() => {
                      if (inputValue === '') {
                        setIsInputMode(false);
                      }
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="What's on your mind?"
                    className="w-full h-full bg-transparent text-white text-base placeholder-white/60 border-none outline-none resize-none font-medium"
                    style={{ fontFamily: 'inherit' }}
                    autoFocus={isInputMode}
                    disabled={isGenerating}
                  />
                )}
              </div>

              <div className="flex justify-between p-4">
                <div
                  className="box p-2 bg-primary text-background rounded-xl cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => setIsComingSoonModalOpen(true)}
                >
                  <Plus size={20} />
                </div>

                <div className="rightSection flex gap-2">
                  <div className="relative model-dropdown">
                    <Shimmer isActive={shimmerActive}>
                      <div
                        className="box px-3 py-2 bg-[#272727] text-white rounded-xl cursor-pointer hover:bg-[#333333] transition-colors flex items-center gap-2 border border-white/10"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <span className="text-sm font-medium">{currentModel?.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </Shimmer>
                    {isDropdownOpen && (<div className="absolute top-full mt-2 right-0 bg-[#272727] rounded-xl shadow-2xl border border-white/10 min-w-[200px] max-h-[200px] overflow-y-auto z-10 p-1">
                      {availableModels.map((model) => {
                        const isDisabled = !session && model.id !== 'llama-4-hackclub' && model.id !== 'deepseek-r1-free';
                        return (
                          <div
                            key={model.id}
                            className={`px-3 py-2 cursor-pointer rounded-lg transition-colors m-1 ${isDisabled
                              ? 'text-gray-500 hover:bg-[#333333]'
                              : selectedModel === model.id
                                ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                                : 'text-white hover:bg-[#333333]'
                              }`}
                            onClick={() => handleModelChange(model.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{model.name}</div>
                                <div className="text-xs text-gray-400">{model.provider}</div>
                              </div>
                              {isDisabled && (
                                <div className="text-xs text-gray-500 ml-2">Sign In</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>                  <div
                    className={`box p-2 rounded-xl cursor-pointer transition-colors ${!isGenerationDisabled()
                      ? 'bg-primary text-background hover:bg-primary/80'
                      : 'bg-gray-600 text-gray-400 cursor-pointer'
                      }`}
                    onClick={handleSubmitButtonClick}
                  >
                    {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowUp size={20} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onClose={() => setIsComingSoonModalOpen(false)}
        feature="Images"
      />

      <PleaseLogin
        isOpen={isPleaseLoginModalOpen}
        onClose={() => setIsPleaseLoginModalOpen(false)}
      />

      <PremiumUpgradeModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        currentModel={availableModels.find(m => m.id === selectedModel)?.name || selectedModel}
      />
    </div>
  );
}