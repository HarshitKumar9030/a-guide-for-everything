import axios from 'axios';

const BASE_URL = 'https://ai.hackclub.com/';

export interface HackClubModelInfo {
    id: string;
    premium: boolean; // whether requires pro/proplus
    thinking: boolean; // returns <think> tags
}

// Heuristic classification (20b+ premium as per request). Llama models removed per latest requirement.
function classifyModel(id: string): HackClubModelInfo {
    const lower = id.toLowerCase();
    const thinking = /qwen|maverick|kimi/.test(lower); // llama removed
    const premium = /20b|32b|120b/.test(lower) || /gpt-oss-120b/.test(lower);
    return { id, premium, thinking };
}

export async function listHackClubModels(): Promise<HackClubModelInfo[]> {
    try {
        const res = await axios.get(`${BASE_URL}model`);
        const raw: string | { models?: string[] } | string[] = res.data;
        let list: string[] = [];

        if (Array.isArray(raw)) {
            list = raw as string[];
        } else if (typeof raw === 'string') {
            // API currently returns a comma separated string
            list = raw.split(',').map(s => s.trim()).filter(Boolean);
        } else if (raw?.models && Array.isArray(raw.models)) {
            list = raw.models;
        }

        // Fallback static list if API changes or returns empty
        if (!list.length) {
            list = [
                'qwen/qwen3-32b',
                'openai/gpt-oss-120b',
                'openai/gpt-oss-20b',
                'moonshotai/kimi-k2-instruct',
                'moonshotai/kimi-k2-instruct-0905',
                'meta-llama/llama-4-maverick' // will be filtered below
            ];
        }

        // Remove llama models fully per product decision
        list = list.filter(m => !/llama/i.test(m));

        // Deduplicate just in case
        list = Array.from(new Set(list));

        return list.map(classifyModel);
    } catch (e) {
            console.error('Failed to list HackClub models – using static fallback', e);
            const fallback = [
                'qwen/qwen3-32b',
                'openai/gpt-oss-120b',
                'openai/gpt-oss-20b',
                'moonshotai/kimi-k2-instruct-0905',
                'moonshotai/kimi-k2-instruct'
            ];
            return fallback.map(classifyModel);
    }
}

export function stripThinkTags(text: string): string {
    if (!text) return text;
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
  from documentation:
 curl -X POST https://ai.hackclub.com/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "messages": [{"role": "user", "content": "Tell me a joke!"}]
    }'
 */

export async function aiCompletion(prompt: string, model?: string) {
    try {
        const response = await axios.post(
            `${BASE_URL}chat/completions`,
            {
                model,
                messages: [{ role: 'user', content: prompt }],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.HACKCLUB_API_KEY}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error in aiCompletion:', error);
        throw error;
    }
}