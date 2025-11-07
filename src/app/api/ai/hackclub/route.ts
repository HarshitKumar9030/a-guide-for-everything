import { NextRequest, NextResponse } from 'next/server';
import { aiCompletion, listHackClubModels, stripThinkTags } from '@/lib/ai/hackclub';
import { checkAndIncrementUsage, recordUsage } from '@/lib/usage';
import { getUserPlan, checkModelAccess } from '@/lib/user-plan';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  // return model catalog with classification
  const models = await listHackClubModels();
  return new Response(JSON.stringify({ models }), { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Require auth now for tracking
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const planDoc = await getUserPlan(userEmail);

    // Determine selected model & classify
    const models = await listHackClubModels();
    const available = models.find(m => m.id === model) || models[0];
    const selected = available?.id;
    if (!selected) {
      return NextResponse.json({ error: 'No models available' }, { status: 503 });
    }

    // Determine usage bucket using new separation (osslarge vs llama)
    let bucket: string = 'llama';
    if (/qwen3-32b|gpt-oss-20b|gpt-oss-120b/i.test(selected)) bucket = 'osslarge';
    else if (/kimi/i.test(selected)) bucket = 'llama';
    // Map bucket to plan model name for access check (osslarge distinct from gpt41)
    if (!checkModelAccess(planDoc.plan, bucket)) {
      return NextResponse.json({ error: 'Model not available on your plan' }, { status: 403 });
    }
    // Enforce per-bucket generation limits through usage util

    const usageCheck = await checkAndIncrementUsage(userEmail, bucket);
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.reason }, { status: 429 });
    }
  const result = await aiCompletion(prompt, selected);
    
    // Extract the response text from the API response
    let responseText = result.choices?.[0]?.message?.content || 'No response received';
    if (models.find(m => m.id === selected)?.thinking) {
      responseText = stripThinkTags(responseText);
    }

    const usageTokens = result?.usage || {};
    const extractToken = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
    const promptTokens = extractToken((usageTokens as { prompt_tokens?: number }).prompt_tokens);
    const completionTokens = extractToken((usageTokens as { completion_tokens?: number }).completion_tokens);
    let totalTokens = extractToken((usageTokens as { total_tokens?: number }).total_tokens);
    if (!totalTokens && (promptTokens || completionTokens)) {
      totalTokens = promptTokens + completionTokens;
    }

    await recordUsage(userEmail, bucket, {
      text: 1,
      tokens: totalTokens,
    });

    return NextResponse.json({ 
      response: responseText,
      model: selected,
      thinking: !!models.find(m => m.id === selected)?.thinking,
      premium: !!available.premium,
      plan: planDoc.plan,
      usageBucket: bucket,
      remaining: usageCheck.remaining,
      tokens: {
        input: promptTokens,
        output: completionTokens,
        total: totalTokens,
      },
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