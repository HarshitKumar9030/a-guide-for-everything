import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geminiCompletion } from '@/lib/ai/gemini';
import { checkAndIncrementUsage } from '@/lib/usage';
import { getUserPlan, checkModelAccess } from '@/lib/user-plan';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'You must be logged in to use Gemini AI'
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

    // Plan & usage enforcement
    const planDoc = await getUserPlan(session.user.email!);
    const model = 'gemini';
    if (!checkModelAccess(planDoc.plan, model)) {
      return NextResponse.json({ error: 'Model not available on your plan' }, { status: 403 });
    }
    const usageCheck = await checkAndIncrementUsage(session.user.email!, model);
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason }, { status: 429 });
    }

    const result = await geminiCompletion(prompt);

    return NextResponse.json({
      response: result.content,
      model: result.model,
      timestamp: result.timestamp,
      user: session.user.email,
      plan: planDoc.plan,
      remaining: usageCheck.remaining
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
