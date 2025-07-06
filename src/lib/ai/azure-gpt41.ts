import { AzureOpenAI } from 'openai';

const endpoint = process.env.AZURE_GPT41_ENDPOINT;
const apiKey = process.env.AZURE_GPT41_API_KEY;
const modelName = "gpt-4.1";
const deployment = "gpt-4.1";
const apiVersion = "2024-04-01-preview";

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  deployment,
  apiVersion
});

function cleanGPT41Output(content: string): string {
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

export async function gpt41Completion(prompt: string) {
    try {
        if (!process.env.AZURE_GPT41_API_KEY || !process.env.AZURE_GPT41_ENDPOINT) {
            throw new Error('Azure GPT-4.1 credentials are not configured');
        }

        const response = await client.chat.completions.create({
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
            max_completion_tokens: 4000,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0,
            model: modelName
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from GPT-4.1');
        }

        // Clean up any code block formatting
        const cleanedContent = cleanGPT41Output(content);

        return {
            success: true,
            content: cleanedContent,
            model: 'gpt-4.1',
            timestamp: new Date().toISOString(),
            tokens: {
                input: response.usage?.prompt_tokens || 0,
                output: response.usage?.completion_tokens || 0,
                total: response.usage?.total_tokens || 0
            }
        };

    } catch (error) {
        console.error('Error in gpt41Completion:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate GPT-4.1 response');
    }
}

export async function gpt41CompletionStream(prompt: string) {
    try {
        if (!process.env.AZURE_GPT41_API_KEY || !process.env.AZURE_GPT41_ENDPOINT) {
            throw new Error('Azure GPT-4.1 credentials are not configured');
        }

        const stream = await client.chat.completions.create({
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
            max_completion_tokens: 4000,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0,
            model: modelName,
            stream: true
        });

        return stream;

    } catch (error) {
        console.error('Error in gpt41CompletionStream:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to stream GPT-4.1 response');
    }
}
