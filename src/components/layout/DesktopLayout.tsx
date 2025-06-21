'use client';
import React, { useState } from 'react';
import CoolSquare from '../core/CoolSquare';
import { DefaultTypewriterText } from '../animation/text';
import Shimmer, { useShimmer } from '../animation/shimmer';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import Stars from '../core/Stars';
import ComingSoonModal from '../core/ComingSoonModal';

// Export the model type and available models
export type ModelType = 'gemini-flash-2.5' | 'llama-3.2-hackclub';

export const availableModels = [
    { id: 'gemini-flash-2.5' as ModelType, name: 'Gemini Flash 2.5', provider: 'Google' },
    { id: 'llama-3.2-hackclub' as ModelType, name: 'Llama 3.2', provider: 'HackClub' }
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
    console.log('Model changed to:', model);
};

export default function DesktopLayout() {
    const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-flash-2.5');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isInputMode, setIsInputMode] = useState(false);
    const [showHoverBubble, setShowHoverBubble] = useState(false);
    const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
    const shimmerActive = useShimmer(selectedModel);

    const handleModelChange = (model: ModelType) => {
        setSelectedModel(model);
        updateSelectedModel(model);
        setIsDropdownOpen(false);
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
        <div className="h-screen  w-screen flex items-center justify-center">

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
            <div className='absolute top-8 left-12'>
                <Stars />
            </div>          

            <div className="flex flex-col items-center justify-center">
                <div className="font-just-another-hand text-[96px]">A Guide For Everything</div>
                <div className="text-xl text-secondary w-1/2 text-center">Smart guides powered by AI to help families coordinate schedules, manage shift work routines, plan meals, optimize sleep patterns, and maintain work-life balance across different shift rotations.</div>                <div className="mt-3 w-1/2 bg-primary h-48 rounded-2xl relative">
                    <div className="flex h-full w-full flex-col justify-between">
                        <div
                            className="flex-1 p-4 relative cursor-text"
                            onClick={() => setIsInputMode(true)}
                            onMouseEnter={() => setShowHoverBubble(true)}
                            onMouseLeave={() => setShowHoverBubble(false)}
                        >
                            {!isInputMode && inputValue === '' ? (
                                <div className="text-background text-[18px] font-medium">
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
                                    className="w-full h-full bg-transparent text-black text-[18px] placeholder-black/60 border-none outline-none resize-none font-medium"
                                    style={{ fontFamily: 'inherit' }}
                                    autoFocus={isInputMode}
                                />
                            )}

                            {showHoverBubble && !isInputMode && inputValue === '' && (
                                <div className="absolute -right-4 top-1/2 transform translate-x-full -translate-y-1/2 z-20">
                                    <div className="bg-white text-background px-3 py-2 rounded-lg shadow-lg border text-sm font-medium whitespace-nowrap">
                                        Thinking something?
                                        <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-white border-l border-b rotate-45"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between p-4">                            <div 
                                className="box p-2 bg-white text-background rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setIsComingSoonModalOpen(true)}
                            >
                                <Plus />
                            </div><div className="rightSection flex gap-2">
                                <div className="relative model-dropdown">
                                    <Shimmer isActive={shimmerActive}>
                                        <div
                                            className="box px-4 py-2 bg-white text-background rounded-xl cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-2"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            {currentModel?.name}
                                            <ArrowDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </Shimmer>                                    {isDropdownOpen && (
                                        <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border min-w-[200px] max-w-[250px] max-h-[200px] overflow-y-auto z-10">
                                            {availableModels.map((model) => (
                                                <div
                                                    key={model.id}
                                                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer first:rounded-t-lg last:rounded-b-lg transition-colors ${selectedModel === model.id ? 'bg-gray-50 text-primary font-semibold' : 'text-background'
                                                        }`}
                                                    onClick={() => handleModelChange(model.id)}
                                                >
                                                    <div className="font-medium">{model.name}</div>
                                                    <div className="text-sm text-gray-500">{model.provider}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="box p-2 bg-white text-background rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">                                    <ArrowUp />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Coming Soon Modal */}
            <ComingSoonModal 
                isOpen={isComingSoonModalOpen}
                onClose={() => setIsComingSoonModalOpen(false)}
                feature="Images"
            />
        </div>
    );
}
