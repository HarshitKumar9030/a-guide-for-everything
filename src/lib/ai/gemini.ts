import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Requires valid API key and user authentication
 */
export async function geminiCompletion(prompt: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini API key is not configured');
        }

        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return {
            success: true,
            content: response.text,
            model: 'gemini-2.5-flash',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Error in geminiCompletion:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate Gemini response');
    }
}

export async function geminiCompletionStream(prompt: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini API key is not configured');
        }

        const response = await genAI.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response;

    } catch (error) {
        console.error('Error in geminiCompletionStream:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to stream Gemini response');
    }
}
