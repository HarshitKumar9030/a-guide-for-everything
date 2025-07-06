import { AzureOpenAI } from 'openai';

const endpoint = process.env.AZURE_TARGET_URI;
const apiKey = process.env.AZURE_API_KEY;
const modelName = "gpt-4.1-mini";
const deployment = "gpt-4.1-mini";
const apiVersion = "2024-04-01-preview";

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  deployment,
  apiVersion
});


export async function gpt41MiniCompletion(prompt: string) {
    try {
        if (!process.env.AZURE_API_KEY || !process.env.AZURE_TARGET_URI) {
            throw new Error('Azure OpenAI credentials are not configured');
        }

        const response = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert guide writer. Create comprehensive, well-structured guides that are educational and actionable. Format your response with clear headings, bullet points, and practical examples."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_completion_tokens: 10000,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0,
            model: modelName
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from GPT-4.1 Mini');
        }

        return {
            success: true,
            content: content,
            model: 'gpt-4.1-mini',
            timestamp: new Date().toISOString(),
            tokens: {
                input: response.usage?.prompt_tokens || 0,
                output: response.usage?.completion_tokens || 0,
                total: response.usage?.total_tokens || 0
            }
        };

    } catch (error) {
        console.error('Error in gpt41MiniCompletion:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate GPT-4.1 Mini response');
    }
}

export async function gpt41MiniCompletionStream(prompt: string) {
    try {
        if (!process.env.AZURE_API_KEY || !process.env.AZURE_TARGET_URI) {
            throw new Error('Azure OpenAI credentials are not configured');
        }

        const stream = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert guide writer. Create comprehensive, well-structured guides that are educational and actionable. Format your response with clear headings, bullet points, and practical examples."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_completion_tokens: 10000,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0,
            model: modelName,
            stream: true
        });

        return stream;

    } catch (error) {
        console.error('Error in gpt41MiniCompletionStream:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to stream GPT-4.1 Mini response');
    }
}
