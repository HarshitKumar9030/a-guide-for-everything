import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

function cleanDeepSeekOutput(content: string): string {
    if (content.startsWith('```markdown\n') && content.endsWith('\n```')) {
        return content.slice(12, -4); // Remove ```markdown\n from start and \n``` from end
    }
    if (content.startsWith('```\n') && content.endsWith('\n```')) {
        return content.slice(4, -4); // Remove ```\n from start and \n``` from end
    }
    if (content.startsWith('```') && content.endsWith('```')) {
        return content.slice(3, -3); // Remove ``` from start and end
    }
    return content;
}

export async function deepseekCompletion(prompt: string) {
    try {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key is not configured');
        }

        const response = await openai.chat.completions.create({
            model: "deepseek/deepseek-r1:free",
            messages: [
                {
                    role: "system",
                    content: "You are an expert guide writer. Create comprehensive, well-structured guides that are educational and actionable. Format your response in clean markdown with clear headings, bullet points, and practical examples. Do not wrap your response in code blocks or use triple backticks. Start directly with the content."
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            max_tokens: 4000,
            temperature: 0.7,
            top_p: 0.9,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from DeepSeek R1');
        }

        // Clean up any code block formatting
        const cleanedContent = cleanDeepSeekOutput(content);

        return {
            success: true,
            content: cleanedContent,
            model: 'deepseek-r1-free',
            timestamp: new Date().toISOString(),
            tokens: {
                input: response.usage?.prompt_tokens || 0,
                output: response.usage?.completion_tokens || 0,
                total: response.usage?.total_tokens || 0
            }
        };

    } catch (error) {
        console.error('Error in deepseekCompletion:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate DeepSeek R1 response');
    }
}

export async function deepseekCompletionStream(prompt: string) {
    try {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key is not configured');
        }

        const stream = await openai.chat.completions.create({
            model: "deepseek/deepseek-r1:free",
            messages: [
                {
                    role: "system",
                    content: "You are an expert guide writer. Create comprehensive, well-structured guides that are educational and actionable. Format your response in clean markdown with clear headings, bullet points, and practical examples. Do not wrap your response in code blocks or use triple backticks. Start directly with the content."
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            max_tokens: 4000,
            temperature: 0.7,
            top_p: 0.9,
            stream: true,
        });

        return stream;

    } catch (error) {
        console.error('Error in deepseekCompletionStream:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to stream DeepSeek R1 response');
    }
}
