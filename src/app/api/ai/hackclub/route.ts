import { NextRequest, NextResponse } from 'next/server';
import { aiCompletion } from '@/lib/ai/hackclub';
import { checkAndIncrementUsage } from '@/lib/usage';
import { getUserPlan, checkModelAccess } from '@/lib/user-plan';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const model = 'llama'; // treat hackclub model as llama bucket (adjust if needed)
    // Optional: if auth required for usage tracking; currently open so we skip session
    // Could enforce login if desired.
    const userEmail = 'anonymous@local';
    const planDoc = await getUserPlan(userEmail);
    if (!checkModelAccess(planDoc.plan, model)) {
      return NextResponse.json({ error: 'Model not available on your plan' }, { status: 403 });
    }
    const usageCheck = await checkAndIncrementUsage(userEmail, model);
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason }, { status: 429 });
    }
    const result = await aiCompletion(prompt);
    
    // Extract the response text from the API response
    const responseText = result.choices?.[0]?.message?.content || 'No response received';

    return NextResponse.json({ 
      response: responseText,
      raw: result,
      plan: planDoc.plan,
      remaining: usageCheck.remaining
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