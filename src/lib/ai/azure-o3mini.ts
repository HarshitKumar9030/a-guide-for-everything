import { AzureOpenAI } from 'openai';

const endpoint = process.env.AZURE_O3_ENDPOINT;
const apiKey = process.env.AZURE_O3_API_KEY;
const modelName = "o3-mini";
const deployment = "o3-mini";
const apiVersion = "2024-12-01-preview";

const client = new AzureOpenAI({
  endpoint,
  apiKey,
  deployment,
  apiVersion
});

function cleanO3Output(content: string): string {
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


export async function o3MiniCompletion(prompt: string) {
    try {
        if (!process.env.AZURE_O3_API_KEY || !process.env.AZURE_O3_ENDPOINT) {
            throw new Error('Azure O3 credentials are not configured');
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
            model: modelName
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from O3 Mini');
        }

        // Clean up any code block formatting
        const cleanedContent = cleanO3Output(content);

        return {
            success: true,
            content: cleanedContent,
            model: 'o3-mini',
            timestamp: new Date().toISOString(),
            tokens: {
                input: response.usage?.prompt_tokens || 0,
                output: response.usage?.completion_tokens || 0,
                total: response.usage?.total_tokens || 0
            }
        };

    } catch (error) {
        console.error('Error in o3MiniCompletion:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate O3 Mini response');
    }
}

export async function o3MiniCompletionStream(prompt: string) {
    try {
        if (!process.env.AZURE_O3_API_KEY || !process.env.AZURE_O3_ENDPOINT) {
            throw new Error('Azure O3 credentials are not configured');
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
            model: modelName,
            stream: true
        });

        return stream;

    } catch (error) {
        console.error('Error in o3MiniCompletionStream:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to stream O3 Mini response');
    }
}
