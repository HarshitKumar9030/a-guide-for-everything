import { NextRequest, NextResponse } from 'next/server';
import { aiCompletion } from '@/lib/ai/hackclub';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await aiCompletion(prompt);
    
    // Extract the response text from the API response
    const responseText = result.choices?.[0]?.message?.content || 'No response received';

    return NextResponse.json({ 
      response: responseText,
      raw: result 
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}