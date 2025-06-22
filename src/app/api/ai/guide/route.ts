import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geminiCompletion } from '@/lib/ai/gemini';
import { aiCompletion } from '@/lib/ai/hackclub';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'You must be logged in to generate guides'
        },
        { status: 401 }
      );
    }

    const { prompt, model } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        { error: 'Prompt is too long. Maximum length is 10,000 characters.' },
        { status: 400 }
      );
    }

    if (!model || !['gemini-flash-2.5', 'llama-4-hackclub'].includes(model)) {
      return NextResponse.json(
        { error: 'Invalid model specified' },
        { status: 400 }
      );
    }    // Enhanced prompt for comprehensive guide generation
    const enhancedPrompt = `You are an expert guide creator. Create a comprehensive, detailed guide for the following request: "${prompt}"

Please format your response in markdown with the following structure:
- Start with a brief "In a Nutshell" summary (2-3 sentences explaining what this guide covers)
- Use proper headings (# ## ###)
- Include practical steps and actionable advice
- Add relevant tips and best practices
- Include examples where helpful
- Make it well-organized and easy to follow
- Ensure the content is thorough and valuable

Format your response as follows:
## In a Nutshell
[Brief 2-3 sentence summary of what this guide covers and what the user will achieve]

# [Main Title]
[Rest of the detailed guide content...]

The guide should be engaging, informative, and tailored specifically to help with: ${prompt}

Generate a complete guide that someone could actually use to achieve their goal.`;

    let result;
    let response;

    if (model === 'gemini-flash-2.5') {
      result = await geminiCompletion(enhancedPrompt);
      response = {
        guide: result.content,
        model: result.model,
        timestamp: result.timestamp,
        user: session.user.email,
        originalPrompt: prompt
      };
    } else {
      // HackClub model
      result = await aiCompletion(enhancedPrompt);
      const responseText = result.choices?.[0]?.message?.content || 'No response received';
      response = {
        guide: responseText,
        model: 'llama-4-hackclub',
        timestamp: new Date().toISOString(),
        user: session.user.email,
        originalPrompt: prompt
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Guide Generation API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
