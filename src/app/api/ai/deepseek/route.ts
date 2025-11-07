import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deepseekCompletion } from '@/lib/ai/deepseek';
import { checkModelAccess } from '@/lib/user-plan';
import { checkAndIncrementUsage, recordUsage } from '@/lib/usage';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'You must be logged in to use DeepSeek R1'
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

    // Enforce plan & usage (deepseek bucket key is 'deepseek')
    const { getUserPlan } = await import('@/lib/user-plan');
    const planDoc = await getUserPlan(session.user.email!);
    if (!checkModelAccess(planDoc.plan, 'deepseek')) {
      return NextResponse.json({ error: 'Model not available on your plan' }, { status: 403 });
    }
    const usageCheck = await checkAndIncrementUsage(session.user.email!, 'deepseek');
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason }, { status: 429 });
    }

    const result = await deepseekCompletion(prompt);

    const totalTokens = result.tokens?.total ?? 0;

    await recordUsage(session.user.email!, 'deepseek', {
      text: 1,
      tokens: totalTokens,
    });

    return NextResponse.json({
      response: result.content,
      model: result.model,
      timestamp: result.timestamp,
      tokens: result.tokens,
      user: session.user.email,
      remaining: usageCheck.remaining,
      plan: planDoc.plan,
    });

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
