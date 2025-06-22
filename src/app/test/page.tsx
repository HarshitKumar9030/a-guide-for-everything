'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { User, Lock } from 'lucide-react';

type AIModel = 'hackclub' | 'gemini';

export default function TestPage() {
    const { data: session } = useSession();
    const [prompt, setPrompt] = useState(''); const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedModel, setSelectedModel] = useState<AIModel>('hackclub');
    const [responseTime, setResponseTime] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        // Check if Gemini is selected and user is not authenticated
        if (selectedModel === 'gemini' && !session) {
            setError('Authentication required for Gemini. Please sign in.');
            return;
        } setIsLoading(true);
        setError('');
        setResponse('');
        setResponseTime(null);

        const startTime = Date.now();

        try {
            const endpoint = selectedModel === 'gemini' ? '/api/ai/gemini' : '/api/ai/hackclub';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            const endTime = Date.now();
            setResponseTime(endTime - startTime);
            setResponse(data.response);
        } catch (error) {
            console.error('Error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };
    const clearAll = () => {
        setPrompt('');
        setResponse('');
        setError('');
        setResponseTime(null);
    };

    return (
        <div className="min-h-screen bg-[#141414] p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-8">
                    <h1 className="text-white text-4xl font-bold text-center">
                        AI Integration
                    </h1>
                </div>

                {/* Authentication Status */}
                <div className="bg-[#1E1E1E] rounded-2xl p-6 mb-8 border border-[#323232]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {session ? (
                                <>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <User className="w-5 h-5 text-green-400" />
                                    <div>
                                        <p className="text-white font-medium">Authenticated</p>
                                        <p className="text-gray-400 text-sm">{session.user?.email}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <Lock className="w-5 h-5 text-red-400" />
                                    <div>
                                        <p className="text-white font-medium">Not Authenticated</p>
                                        <p className="text-gray-400 text-sm">Login required for Gemini</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {!session && (
                            <button
                                onClick={() => signIn()}
                                className="bg-[#1BE1FF] hover:bg-[#1BE1FF]/80 text-black px-4 py-2 rounded-lg transition-colors font-medium"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-[#1E1E1E] rounded-2xl p-8 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-white text-lg font-medium mb-4">
                                Select AI Model:
                            </label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedModel('hackclub')}
                                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${selectedModel === 'hackclub'
                                        ? 'bg-[#1BE1FF] text-black'
                                        : 'bg-[#323232] text-white hover:bg-[#3a3a3a]'
                                        }`}
                                >
                                    HackClub AI
                                    <span className="block text-xs opacity-70">Free • No Auth Required</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedModel('gemini')}
                                    disabled={!session}
                                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${selectedModel === 'gemini'
                                        ? 'bg-[#1BE1FF] text-black'
                                        : session
                                            ? 'bg-[#323232] text-white hover:bg-[#3a3a3a]'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        }`}
                                >                  Google Gemini
                                    <span className="block text-xs opacity-70">
                                        {session ? 'Auth Required' : 'Login Required'}
                                    </span>
                                </button>
                            </div>

                            {selectedModel === 'gemini' && !session && (
                                <div className="mt-4 bg-yellow-900/20 border border-yellow-500 rounded-xl p-4">
                                    <div className="flex items-center space-x-2">
                                        <Lock className="w-5 h-5 text-yellow-400" />
                                        <p className="text-yellow-300 font-medium">Authentication Required</p>
                                    </div>
                                    <p className="text-yellow-200 text-sm mt-1">
                                        You must be signed in to access Google Gemini features.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="prompt" className="block text-white text-lg font-medium mb-2">
                                Enter your prompt for {selectedModel === 'gemini' ? 'Gemini' : 'HackClub AI'}:
                            </label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={
                                    selectedModel === 'gemini' && !session
                                        ? "Please sign in to use Gemini"
                                        : `Ask ${selectedModel === 'gemini' ? 'Gemini' : 'HackClub AI'} anything...`
                                }
                                className="w-full h-32 p-4 bg-[#272727] text-white rounded-xl border border-[#323232] focus:outline-none focus:ring-2 focus:ring-[#1BE1FF] resize-none disabled:cursor-not-allowed"
                                disabled={isLoading || (selectedModel === 'gemini' && !session)}
                            />
                            <p className="text-gray-400 text-sm mt-2">
                                {prompt.length}/10,000 characters • Model: {selectedModel === 'gemini' ? 'Google Gemini 2.5 Flash' : 'HackClub AI'}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading || !prompt.trim() || (selectedModel === 'gemini' && !session)}
                                className="bg-[#1BE1FF] hover:bg-[#1BE1FF]/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium px-8 py-3 rounded-xl transition-colors"
                            >
                                {isLoading
                                    ? `Generating...`
                                    : `Ask ${selectedModel === 'gemini' ? 'Gemini' : 'HackClub AI'}`
                                }
                            </button>

                            <button
                                type="button"
                                onClick={clearAll}
                                className="bg-[#323232] hover:bg-[#3a3a3a] text-white font-medium px-8 py-3 rounded-xl transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 mb-8">
                        <h2 className="text-red-400 text-xl font-semibold mb-2">Error:</h2>
                        <p className="text-red-300">{error}</p>
                    </div>
                )}        {response && (
                    <div className="bg-[#1E1E1E] rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <h2 className="text-white text-xl font-semibold">
                                    {selectedModel === 'gemini' ? 'Gemini' : 'HackClub AI'} Response:
                                </h2>
                                <span className="bg-[#323232] text-gray-300 px-3 py-1 rounded-full text-sm">
                                    {selectedModel === 'gemini' ? 'Google Gemini 2.5 Flash' : 'HackClub AI'}
                                </span>
                            </div>
                            {responseTime && (
                                <span className="bg-green-900/20 text-green-400 px-3 py-1 rounded-full text-sm">
                                    {responseTime}ms
                                </span>
                            )}
                        </div>
                        <div className="bg-[#272727] rounded-xl p-6">
                            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {response}
                            </div>
                        </div>
                    </div>
                )}        {isLoading && (
                    <div className="bg-[#1E1E1E] rounded-2xl p-8">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1BE1FF]"></div>
                            <p className="text-white">
                                {selectedModel === 'gemini' ? 'Gemini is thinking...' : 'HackClub AI is generating...'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}