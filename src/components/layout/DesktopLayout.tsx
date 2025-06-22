import React, { useState } from 'react';
import CoolSquare from '../core/CoolSquare';
import { DefaultTypewriterText } from '../animation/text';
import Shimmer, { useShimmer } from '../animation/shimmer';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import Stars from '../core/Stars';
import ComingSoonModal from '../core/ComingSoonModal';
import PleaseLogin from '../core/PleaseLogin';
// import Footer from '../core/Footer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGuide } from '@/contexts/GuideContext';
import { GuideStorage } from '@/lib/guide-storage';

// Export the model type and available models
export type ModelType = 'gemini-flash-2.5' | 'llama-4-hackclub';

export const availableModels = [
    { id: 'gemini-flash-2.5' as ModelType, name: 'Gemini Flash 2.5', provider: 'Google' },
    { id: 'llama-4-hackclub' as ModelType, name: 'Llama 4', provider: 'HackClub' }
];

let selectedModelGlobal: ModelType = 'gemini-flash-2.5';
let modelChangeListeners: ((model: ModelType) => void)[] = [];

export const useSelectedModel = () => {
    const [model, setModel] = useState<ModelType>(selectedModelGlobal);

    React.useEffect(() => {
        const listener = (newModel: ModelType) => setModel(newModel);
        modelChangeListeners.push(listener);

        return () => {
            modelChangeListeners = modelChangeListeners.filter(l => l !== listener);
        };
    }, []);

    return model;
};

export const updateSelectedModel = (model: ModelType) => {
    selectedModelGlobal = model;
    modelChangeListeners.forEach(listener => listener(model));
};

export default function DesktopLayout() {
    const { data: session } = useSession();
    const router = useRouter();
    const { startGeneration, finishGeneration, setError } = useGuide();
    const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-flash-2.5');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isInputMode, setIsInputMode] = useState(false);
    const [showHoverBubble, setShowHoverBubble] = useState(false);
    const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
    const [isPleaseLoginModalOpen, setIsPleaseLoginModalOpen] = useState(false);
    const [shimmerTrigger, setShimmerTrigger] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const shimmerActive = useShimmer(shimmerTrigger);

    // Debug shimmer state
    React.useEffect(() => {
    }, [shimmerActive]);    const handleModelChange = (model: ModelType) => {
        console.log('Model change started:', model);
        setSelectedModel(model);
        updateSelectedModel(model);
        setIsDropdownOpen(false);

        // explicitly triggering shimmer 150ms after the model is changed
        setTimeout(() => {
            const newTrigger = Date.now(); // Using timestamp to ensure it's always different
            setShimmerTrigger(newTrigger);
        }, 150);        console.log('Model changed, shimmer will trigger in 150ms:', model);
    };    const handleInputClick = () => {
        if (!session) {
            setIsPleaseLoginModalOpen(true);
            return;
        }
        setIsInputMode(true);
    };    const handleSubmit = async () => {
        if (!inputValue.trim() || !session || isGenerating) return;

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

            if (!response.ok) {
                throw new Error('Failed to generate guide');
            }

            const data = await response.json();
            
            // Add token estimation
            const tokens = GuideStorage.estimateTokens(data.guide);
            const guideData = { ...data, tokens };
            
            // Store guide data and navigate to guide page
            GuideStorage.storeGuide(guideData);
            finishGeneration();
            setInputValue(''); // Clear input after successful generation
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
        <div className="h-screen overflow-x-hidden bg-[#272727] w-screen flex items-center justify-center">

            <div className='absolute top-14 right-14'>
                <CoolSquare
                    className=''
                    size={220}
                    lineThickness={1}
                    lineStyle="dashed"
                    circleSize={24}
                    rotate={30}
                />
            </div>
            <div className='absolute bottom-14 left-14'>
                <CoolSquare
                    className=''
                    size={220}
                    lineThickness={1}
                    lineStyle="dashed"
                    circleSize={24}
                    rotate={30}
                />
            </div>
            <div className='fixed top-8 left-8'>
                <Stars />
            </div>

            <div className="flex flex-col  items-center justify-center">
                <div className="font-just-another-hand text-[96px]">A Guide For Everything</div>
                <div className="text-xl text-secondary w-1/2 text-center">Smart guides powered by AI to help families coordinate schedules, manage shift work routines, plan meals, optimize sleep patterns, and maintain work-life balance across different shift rotations.</div>                
                <div className="mt-4 w-1/2 bg-[#1E1E1E] border border-white/10 h-48 rounded-2xl relative">
                    <div className="flex h-full w-full flex-col justify-between">
                        <div
                            className="flex-1 p-4 relative cursor-text"
                            onClick={handleInputClick}
                            onMouseEnter={() => setShowHoverBubble(true)}
                            onMouseLeave={() => setShowHoverBubble(false)}
                        >                            {!isInputMode && inputValue === '' ? (
                            <div className="text-white text-[18px] font-medium">
                                <DefaultTypewriterText />
                            </div>                        ) : (
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
                                className="w-full h-full bg-transparent text-white text-[18px] placeholder-white/60 border-none outline-none resize-none font-medium"
                                style={{ fontFamily: 'inherit' }}
                                autoFocus={isInputMode}
                                disabled={isGenerating}
                            />
                        )}{showHoverBubble && !isInputMode && inputValue === '' && (
                            <div className="absolute -right-4 top-1/2 transform translate-x-full -translate-y-1/2 z-20">
                                <div className="bg-[#272727] text-white px-3 py-2 rounded-lg shadow-lg border border-white/10 text-sm font-medium whitespace-nowrap">
                                    Thinking something?
                                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#272727] border-l border-b border-white/10 rotate-45"></div>
                                </div>
                            </div>
                        )}
                        </div>                        <div className="flex justify-between p-4">
                            <div
                                className="box p-2 bg-primary text-background rounded-xl cursor-pointer hover:bg-primary/80 transition-colors"
                                onClick={() => setIsComingSoonModalOpen(true)}
                            >
                                <Plus />
                            </div>
                            <div className="rightSection flex gap-2">
                                <div className="relative model-dropdown">
                                    <Shimmer isActive={shimmerActive}>
                                        <div
                                            className="box px-4 py-2 bg-[#272727] text-white rounded-xl cursor-pointer hover:bg-[#333333] transition-colors flex items-center gap-2 border border-white/10"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            <span className="text-sm font-medium">{currentModel?.name}</span>
                                            <ArrowDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </Shimmer>
                                    {isDropdownOpen && (
                                        <div className="absolute top-full mt-2 right-0 bg-[#272727] rounded-xl shadow-2xl border border-white/10 min-w-[220px] max-w-[280px] max-h-[200px] overflow-y-auto z-10 p-1">
                                            {availableModels.map((model) => (
                                                <div
                                                    key={model.id}
                                                    className={`px-3 py-2 hover:bg-[#333333] cursor-pointer rounded-lg transition-colors m-1 ${selectedModel === model.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white'
                                                        }`}
                                                    onClick={() => handleModelChange(model.id)}
                                                >
                                                    <div className="font-medium text-sm">{model.name}</div>
                                                    <div className="text-xs text-gray-400">{model.provider}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>                                <div 
                                    className={`box p-2 rounded-xl cursor-pointer transition-colors ${
                                        inputValue.trim() && !isGenerating 
                                            ? 'bg-primary text-background hover:bg-primary/80' 
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                    onClick={handleSubmit}
                                >
                                    {isGenerating ? (
                                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <ArrowUp />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>            <ComingSoonModal
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
