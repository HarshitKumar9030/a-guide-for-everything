import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gpt41MiniCompletion } from '@/lib/ai/azure-gpt';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'You must be logged in to use GPT-4.1 Mini'
        },
        { status: 401 }
      );
    }

    const { prompt } = await req.json();

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

    const result = await gpt41MiniCompletion(prompt);

    return NextResponse.json({
      response: result.content,
      model: result.model,
      timestamp: result.timestamp,
      tokens: result.tokens,
      user: session.user.email 
    });

  } catch (error) {
    console.error('GPT-4.1 Mini API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
