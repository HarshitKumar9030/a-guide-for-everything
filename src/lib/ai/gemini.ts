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
            timestamp: new Date().toISOString(),
            tokens: {
                input: response.usageMetadata?.promptTokenCount || 0,
                output: response.usageMetadata?.candidatesTokenCount || 0,
                total: response.usageMetadata?.totalTokenCount || 0
            }
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

// Multimodal helper (text + images) used for Nano Banana placeholder.
// Narrowing helpers for Gemini parts without fighting the SDK types.
interface NarrowInlineData { mimeType?: string; data?: string }
interface NarrowPart { inlineData?: NarrowInlineData; text?: string }
function isInlineImage(p: NarrowPart): p is { inlineData: { mimeType?: string; data?: string } } {
    return !!p && typeof p === 'object' && !!p.inlineData?.data;
}
function isTextPart(p: NarrowPart): p is { text: string } {
    return !!p && typeof p === 'object' && typeof p.text === 'string';
}

export async function geminiMultimodal(prompt: string, images: { mimeType: string; data: string }[]) {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key is not configured');
    const parts = [{ text: prompt }, ...images.map(im => ({ inlineData: { mimeType: im.mimeType, data: im.data } }))];
    const response = await genAI.models.generateContent({ model: 'gemini-2.5-flash', contents: [{ role: 'user', parts }] });
    return { success: true, content: response.text, model: 'gemini-2.5-flash', timestamp: new Date().toISOString() };
}

// Generate images (and text) from a pure prompt using image-preview model (stream aggregated).
export async function geminiImagePreview(prompt: string, images?: { mimeType: string; data: string }[]) {
    if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key is not configured');
    const model = 'gemini-2.5-flash-image';
    const parts = [{ text: prompt } as NarrowPart];
    if (images && images.length) {
        for (const im of images.slice(0, 5)) {
            parts.push({ inlineData: { mimeType: im.mimeType, data: im.data } });
        }
    }
    const response = await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
    });
    const outImages: { mimeType: string; data: string }[] = [];
    let text = '';
    try {
        const candidateUnknown = response.candidates?.[0] as unknown;
        let contentParts: NarrowPart[] = [];
        if (candidateUnknown && typeof candidateUnknown === 'object') {
            const maybe = candidateUnknown as { content?: { parts?: unknown } };
            if (maybe.content && Array.isArray(maybe.content.parts)) {
                contentParts = maybe.content.parts as NarrowPart[];
            }
        }
        for (const p of contentParts) {
            if (isInlineImage(p)) {
                outImages.push({ mimeType: p.inlineData.mimeType || 'image/png', data: p.inlineData.data! });
            } else if (isTextPart(p)) {
                text += p.text;
            }
        }
    } catch (err) {
        console.warn('Failed to parse image-preview response parts', err);
    }
    return { success: true, content: text.trim(), images: outImages, model };
}
