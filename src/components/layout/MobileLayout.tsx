'use client';
import React, { useState } from 'react';
import { Plus, ArrowUp, ChevronDown } from 'lucide-react';
// import Stars from '../core/Stars';
import CoolSquare from '../core/CoolSquare';
import ComingSoonModal from '../core/ComingSoonModal';
import PleaseLogin from '../core/PleaseLogin';
import { DefaultTypewriterText } from '../animation/text';
import { ModelType, availableModels, updateSelectedModel } from './DesktopLayout';
import Shimmer, { useShimmer } from '../animation/shimmer';
import { useSession } from 'next-auth/react';

export default function MobileLayout() {
  const { data: session } = useSession();
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-flash-2.5');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [isPleaseLoginModalOpen, setIsPleaseLoginModalOpen] = useState(false);
  const [shimmerTrigger, setShimmerTrigger] = useState(0);
  const shimmerActive = useShimmer(shimmerTrigger);

  const handleModelChange = (model: ModelType) => {
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
    if (!session) {
      setIsPleaseLoginModalOpen(true);
      return;
    }
    setIsInputMode(true);
  };

  const currentModel = availableModels.find(m => m.id === selectedModel);

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
  }, [isDropdownOpen]);

  return (
    <div className="min-h-screen w-screen bg-[#272727] relative overflow-hidden">
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

      {/* <div className="absolute top-[111px] left-[34px]">
        <div className="scale-75 origin-top-left">
          <Stars />
        </div>
      </div> */}

      <div className="flex flex-col h-screen px-5 pt-[220px] relative z-10">
        <h1 className="text-[64px] text-white font-just-another-hand text-center leading-[64px]">
          A Guide For Everything
        </h1>

        <p className="text-[12px] text-[#A2A2A2] text-center mt-1 max-w-[308px] mx-auto">
          Smart guides powered by AI to help families coordinate schedules, manage shift work routines, plan meals, optimize sleep patterns, and maintain work-life balance across different shift rotations.
        </p>

        <div className="mt-6 bg-[#1E1E1E] border border-[#2A2A2A] rounded-[32px] h-[198px] relative">
          <div className="flex h-full w-full flex-col justify-between">            <div
            className="flex-1 p-4 relative cursor-text"
            onClick={handleInputClick}
          >
            {!isInputMode && inputValue === '' ? (
              <div className="text-white text-[16px] font-medium  mt-4">
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
                placeholder="What's on your mind?"
                className="w-full h-full bg-transparent text-white text-[16px] placeholder-white/60 border-none outline-none resize-none font-medium"
                style={{ fontFamily: 'inherit' }}
                autoFocus={isInputMode}
              />
            )}
          </div>

            <div className="flex justify-between items-center p-4">
              <button
                className="w-[37px] h-[37px] bg-primary text-background rounded-[12px] flex items-center justify-center hover:bg-primary/80 transition-colors"
                onClick={() => setIsComingSoonModalOpen(true)}
              >
                <Plus size={20} strokeWidth={2.5} color="#1E1E1E" />
              </button>

              <div className="flex space-x-3">
                <div className="relative model-dropdown">
                  <Shimmer isActive={shimmerActive}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="h-[36px] bg-[#272727] border border-[#323232] text-white rounded-[12px] pl-3 pr-2 flex items-center justify-between gap-1 text-[11px] hover:bg-[#333333] transition-colors"
                      style={{ width: '124px' }}
                    >
                      <span>{currentModel?.name}</span>
                      <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </Shimmer>

                  {isDropdownOpen && (
                    <div className="absolute bottom-full mb-2 right-0 bg-[#272727] rounded-xl shadow-lg border border-white/10 min-w-[124px] z-20 p-1">
                      {availableModels.map((model) => (
                        <div
                          key={model.id}
                          className={`px-3 py-2 hover:bg-[#333333] cursor-pointer rounded-lg transition-colors m-1 ${selectedModel === model.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white'
                            }`}
                          onClick={() => handleModelChange(model.id)}
                        >
                          <div className="font-medium text-[11px]">{model.name}</div>
                          <div className="text-[9px] text-gray-400">{model.provider}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="w-[36px] h-[36px] bg-primary text-background rounded-[12px] flex items-center justify-center hover:bg-primary/80 transition-colors">
                  <ArrowUp size={20} strokeWidth={2.5} color="#1E1E1E" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onClose={() => setIsComingSoonModalOpen(false)}
        feature="Images"
      />

      <PleaseLogin
        isOpen={isPleaseLoginModalOpen}
        onClose={() => setIsPleaseLoginModalOpen(false)}
      />
    </div>
  );
}