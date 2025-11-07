import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geminiCompletion } from '@/lib/ai/gemini';
import { aiCompletion, stripThinkTags } from '@/lib/ai/hackclub';
import { deepseekCompletion } from '@/lib/ai/deepseek';
import { gpt41MiniCompletion } from '@/lib/ai/azure-gpt';
import { gpt41Completion } from '@/lib/ai/azure-gpt41';
import { o3MiniCompletion } from '@/lib/ai/azure-o3mini';
import { getUserLimits, incrementGuideCount } from '@/lib/user-limits';
import { getGuestLimits, incrementGuestGuideCount, getClientIP } from '@/lib/guest-limits';
import { checkGuestGuideLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getUserPlan, checkModelAccess, checkGenerationLimit, getPlanLimits } from '@/lib/user-plan';
import { checkAndIncrementUsage, recordUsage } from '@/lib/usage';
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    // Map incoming model identifier (alias or full id) to:
    //  - usageBucket: one of existing buckets (llama, gemini, deepseek, gpt41, gpt41mini, o3mini)
    //  - hackclubModel: actual HackClub model id (only for HackClub sourced models)
    // Backward compatibility: 'llama' now routes to kimi base model; legacy llama-4 removed.
    interface ModelResolution { usageBucket: string; hackclubModel?: string; }
    const m = (model || '').toLowerCase();
    let resolved: ModelResolution | null = null;
    switch (true) {
      case m === 'gemini' || m === 'gemini-flash-2.5':
        resolved = { usageBucket: 'gemini' }; break;
      case m === 'deepseek' || m === 'deepseek-r1-free':
        resolved = { usageBucket: 'deepseek' }; break;
      case m === 'gpt41' || m === 'gpt-4.1':
        resolved = { usageBucket: 'gpt41' }; break;
      case m === 'gpt41mini' || m === 'gpt-4.1-mini':
        resolved = { usageBucket: 'gpt41mini' }; break;
      case m === 'o3mini' || m === 'o3-mini':
        resolved = { usageBucket: 'o3mini' }; break;
      // New HackClub models & aliases
      case m === 'llama' || m === 'kimi' || m === 'moonshotai/kimi-k2-instruct':
        resolved = { usageBucket: 'llama', hackclubModel: 'moonshotai/kimi-k2-instruct' }; break;
      case m === 'kimi0905' || m === 'moonshotai/kimi-k2-instruct-0905':
        resolved = { usageBucket: 'llama', hackclubModel: 'moonshotai/kimi-k2-instruct-0905' }; break;
      case m === 'qwen32b' || m === 'qwen/qwen3-32b':
        resolved = { usageBucket: 'osslarge', hackclubModel: 'qwen/qwen3-32b' }; break;
      case m === 'gptoss20b' || m === 'openai/gpt-oss-20b':
        resolved = { usageBucket: 'osslarge', hackclubModel: 'openai/gpt-oss-20b' }; break;
      case m === 'gptoss120b' || m === 'openai/gpt-oss-120b':
        resolved = { usageBucket: 'osslarge', hackclubModel: 'openai/gpt-oss-120b' }; break;
      case m === 'nanobanana' || m === 'nano-banana':
        resolved = { usageBucket: 'nanobanana' }; break; // handled via gemini style API later for images
      default:
        resolved = null;
    }

    if (!resolved) {
      return NextResponse.json(
        { error: 'Invalid model. Valid options: gemini, deepseek, gpt41, gpt41mini, o3mini, llama(kimi), kimi, kimi0905, qwen32b, gptoss20b, gptoss120b' },
        { status: 400 }
      );
    }
  const normalizedModel = resolved.usageBucket as 'llama' | 'gemini' | 'deepseek' | 'gpt41' | 'gpt41mini' | 'o3mini' | 'osslarge' | 'nanobanana';

    if (session?.user?.email) {
  const userLimits = await getUserLimits(session.user.email);
      const userPlan = await getUserPlan(session.user.email);
      
      // Check if user has access to the requested model
      if (!checkModelAccess(userPlan.plan, normalizedModel)) {
        return NextResponse.json(
          { 
            error: `This model is not available on your ${userPlan.plan} plan. Please upgrade to access premium models.` 
          },
          { status: 403 }
        );
      }
      
      // Get current usage count for the model
      let currentCount = 0;
      switch (normalizedModel) {
        case 'llama': currentCount = userLimits.llamaGuides; break;
        case 'gemini': currentCount = userLimits.geminiGuides; break;
        case 'deepseek': currentCount = userLimits.deepseekGuides; break;
        case 'gpt41': currentCount = userLimits.gpt41Guides; break;
        case 'gpt41mini': currentCount = userLimits.gpt41miniGuides; break;
        case 'o3mini': currentCount = userLimits.o3miniGuides; break;
  case 'osslarge': currentCount = userLimits.osslargeGuides || 0; break;
  case 'nanobanana': currentCount = (userLimits as unknown as { nanobananaGuides?: number }).nanobananaGuides || 0; break;
      }
      
      // Check if user has reached their generation limit
      if (!checkGenerationLimit(userPlan.plan, normalizedModel, currentCount)) {
        const planLimits = getPlanLimits(userPlan.plan);
        const modelLimit = planLimits[normalizedModel as keyof typeof planLimits];
        
        return NextResponse.json(
          { 
            error: `You have reached your ${normalizedModel} guide limit (${modelLimit} guides). Please upgrade your plan for more generations.` 
          },
          { status: 429 }
        );
      }

      const usageCheck = await checkAndIncrementUsage(session.user.email, normalizedModel);
      if (!usageCheck.allowed) {
        return NextResponse.json({ error: usageCheck.reason }, { status: 429 });
      }

      const result = await generateGuide(prompt, normalizedModel, resolved.hackclubModel);
      
      await incrementGuideCount(session.user.email, normalizedModel);
      await recordUsage(session.user.email, normalizedModel, {
        text: normalizedModel === 'nanobanana' ? 0 : 1,
        images: normalizedModel === 'nanobanana' ? 1 : 0,
        tokens: result.tokens?.total ?? 0,
      });

      // Calculate remaining counts based on plan limits
      const planLimits = getPlanLimits(userPlan.plan);
      const planLimitsExtended = planLimits as typeof planLimits & { nanobanana?: number };
      const userLimitsExtended = userLimits as typeof userLimits & { nanobananaGuides?: number };
      const remaining = {
        llama: planLimits.llama === -1 ? 999999 : Math.max(0, planLimits.llama - userLimits.llamaGuides - (normalizedModel === 'llama' ? 1 : 0)),
        gemini: planLimits.gemini === -1 ? 999999 : Math.max(0, planLimits.gemini - userLimits.geminiGuides - (normalizedModel === 'gemini' ? 1 : 0)),
        deepseek: planLimits.deepseek === -1 ? 999999 : Math.max(0, planLimits.deepseek - userLimits.deepseekGuides - (normalizedModel === 'deepseek' ? 1 : 0)),
        gpt41: planLimits.gpt41 === -1 ? 999999 : Math.max(0, planLimits.gpt41 - userLimits.gpt41Guides - (normalizedModel === 'gpt41' ? 1 : 0)),
        gpt41mini: planLimits.gpt41mini === -1 ? 999999 : Math.max(0, planLimits.gpt41mini - userLimits.gpt41miniGuides - (normalizedModel === 'gpt41mini' ? 1 : 0)),
        o3mini: planLimits.o3mini === -1 ? 999999 : Math.max(0, planLimits.o3mini - userLimits.o3miniGuides - (normalizedModel === 'o3mini' ? 1 : 0)),
  osslarge: planLimits.osslarge === -1 ? 999999 : Math.max(0, planLimits.osslarge - (userLimits.osslargeGuides || 0) - (normalizedModel === 'osslarge' ? 1 : 0)),
        nanobanana: planLimitsExtended.nanobanana === -1 ? 999999 : Math.max(0, (planLimitsExtended.nanobanana ?? 0) - (userLimitsExtended.nanobananaGuides || 0) - (normalizedModel === 'nanobanana' ? 1 : 0)),
      } as const;

      return NextResponse.json({
        ...result,
        user: session.user.email,
        originalPrompt: prompt,
        remaining: remaining,
        usageRemaining: usageCheck.remaining,
      });

    } else {
      // Guest users can only use free models
      if (normalizedModel !== 'llama' && normalizedModel !== 'deepseek') {
        return NextResponse.json(
          { error: 'Guest users can only use the base (llama bucket) or DeepSeek models. Please sign in to access premium models.' },
          { status: 401 }
        );
      }

      const clientIP = getClientIP(req);
      const guestLimits = await getGuestLimits(clientIP);
      
      if (!checkGuestGuideLimit({
        guides: guestLimits.guides
      })) {
        return NextResponse.json(
          { 
            error: `You have reached your guide limit (${RATE_LIMITS.GUEST_GUIDE_LIMIT} guides total). Please sign in to get more guides.`
          },
          { status: 429 }
        );
      }

    const result = await generateGuide(prompt, normalizedModel, resolved.hackclubModel);
      
      await incrementGuestGuideCount(clientIP);

      return NextResponse.json({
        ...result,
        originalPrompt: prompt,
        remaining: {
          guides: RATE_LIMITS.GUEST_GUIDE_LIMIT - guestLimits.guides - 1
        }
      });
    }

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

async function generateGuide(prompt: string, model: string, hackclubModel?: string) {
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

  if (model === 'gemini') {
    const result = await geminiCompletion(enhancedPrompt);
    return {
      guide: result.content,
      model: result.model,
      timestamp: result.timestamp,
      tokens: result.tokens
    };
  } else if (model === 'deepseek') {
    const result = await deepseekCompletion(enhancedPrompt);
    return {
      guide: result.content,
      model: result.model,
      timestamp: result.timestamp,
      tokens: result.tokens
    };
  } else if (model === 'gpt41') {
    const result = await gpt41Completion(enhancedPrompt);
    return {
      guide: result.content,
      model: result.model,
      timestamp: result.timestamp,
      tokens: result.tokens
    };
  } else if (model === 'gpt41mini') {
    const result = await gpt41MiniCompletion(enhancedPrompt);
    return {
      guide: result.content,
      model: result.model,
      timestamp: result.timestamp,
      tokens: result.tokens
    };
  } else if (model === 'o3mini') {
    const result = await o3MiniCompletion(enhancedPrompt);
    return {
      guide: result.content,
      model: result.model,
      timestamp: result.timestamp,
      tokens: result.tokens
    };
  } else if (model === 'llama') {
    // Use HackClub completion with selected (kimi etc.) model
    const result = await aiCompletion(enhancedPrompt, hackclubModel);
    let responseText = result.choices?.[0]?.message?.content || 'No response received';
    // Remove think tags if present (kimi/qwen models)
    responseText = stripThinkTags(responseText);
    return {
      guide: responseText,
      model: hackclubModel || 'moonshotai/kimi-k2-instruct',
      timestamp: new Date().toISOString(),
      tokens: {
        input: 0,
        output: 0,
        total: 0
      }
    };
  } else {
    // Fallback: treat as deepseek (should not normally hit)
    const result = await deepseekCompletion(enhancedPrompt);
    return { guide: result.content, model: result.model, timestamp: result.timestamp, tokens: result.tokens };
  }
}
