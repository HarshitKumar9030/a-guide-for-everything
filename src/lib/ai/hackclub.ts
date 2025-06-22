import axios from 'axios';

const BASE_URL = 'https://ai.hackclub.com/';

/**
  from documentation:
 curl -X POST https://ai.hackclub.com/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "messages": [{"role": "user", "content": "Tell me a joke!"}]
    }'
 */

export async function aiCompletion(prompt: string) {
    try {
        const response = await axios.post(
            `${BASE_URL}chat/completions`,
            {
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