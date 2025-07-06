import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geminiCompletion } from '@/lib/ai/gemini';
import { aiCompletion } from '@/lib/ai/hackclub';
import { deepseekCompletion } from '@/lib/ai/deepseek';
import { gpt41MiniCompletion } from '@/lib/ai/azure-gpt';
import { gpt41Completion } from '@/lib/ai/azure-gpt41';
import { o3MiniCompletion } from '@/lib/ai/azure-o3mini';
import { getUserLimits, incrementGuideCount } from '@/lib/user-limits';
import { getGuestLimits, incrementGuestGuideCount, getClientIP } from '@/lib/guest-limits';
import { checkGuestGuideLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getUserPlan, checkModelAccess, checkGenerationLimit, getPlanLimits } from '@/lib/user-plan';
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

    let normalizedModel = '';
    if (model === 'gemini-flash-2.5' || model === 'gemini') {
      normalizedModel = 'gemini';
    } else if (model === 'llama-4-hackclub' || model === 'llama') {
      normalizedModel = 'llama';
    } else if (model === 'deepseek-r1-free' || model === 'deepseek') {
      normalizedModel = 'deepseek';
    } else if (model === 'gpt-4.1' || model === 'gpt41') {
      normalizedModel = 'gpt41';
    } else if (model === 'gpt-4.1-mini' || model === 'gpt41mini') {
      normalizedModel = 'gpt41mini';
    } else if (model === 'o3-mini' || model === 'o3mini') {
      normalizedModel = 'o3mini';
    } else {
      return NextResponse.json(
        { error: 'Invalid model specified. Use "gemini", "llama", "deepseek", "gpt41", "gpt41mini", or "o3mini".' },
        { status: 400 }
      );
    }

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
        case 'llama':
          currentCount = userLimits.llamaGuides;
          break;
        case 'gemini':
          currentCount = userLimits.geminiGuides;
          break;
        case 'deepseek':
          currentCount = userLimits.deepseekGuides;
          break;
        case 'gpt41':
          currentCount = userLimits.gpt41Guides;
          break;
        case 'gpt41mini':
          currentCount = userLimits.gpt41miniGuides;
          break;
        case 'o3mini':
          currentCount = userLimits.o3miniGuides;
          break;
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

      const result = await generateGuide(prompt, normalizedModel);
      
      await incrementGuideCount(session.user.email, normalizedModel);

      // Calculate remaining counts based on plan limits
      const planLimits = getPlanLimits(userPlan.plan);
      const remaining = {
        llama: planLimits.llama === -1 ? 999999 : Math.max(0, planLimits.llama - userLimits.llamaGuides - (normalizedModel === 'llama' ? 1 : 0)),
        gemini: planLimits.gemini === -1 ? 999999 : Math.max(0, planLimits.gemini - userLimits.geminiGuides - (normalizedModel === 'gemini' ? 1 : 0)),
        deepseek: planLimits.deepseek === -1 ? 999999 : Math.max(0, planLimits.deepseek - userLimits.deepseekGuides - (normalizedModel === 'deepseek' ? 1 : 0)),
        gpt41: planLimits.gpt41 === -1 ? 999999 : Math.max(0, planLimits.gpt41 - userLimits.gpt41Guides - (normalizedModel === 'gpt41' ? 1 : 0)),
        gpt41mini: planLimits.gpt41mini === -1 ? 999999 : Math.max(0, planLimits.gpt41mini - userLimits.gpt41miniGuides - (normalizedModel === 'gpt41mini' ? 1 : 0)),
        o3mini: planLimits.o3mini === -1 ? 999999 : Math.max(0, planLimits.o3mini - userLimits.o3miniGuides - (normalizedModel === 'o3mini' ? 1 : 0))
      };

      return NextResponse.json({
        ...result,
        user: session.user.email,
        originalPrompt: prompt,
        remaining: remaining
      });

    } else {
      // Guest users can only use free models
      if (normalizedModel !== 'llama' && normalizedModel !== 'deepseek') {
        return NextResponse.json(
          { error: 'Guest users can only use the Llama or DeepSeek models. Please sign in to access premium models.' },
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

      const result = await generateGuide(prompt, normalizedModel);
      
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

async function generateGuide(prompt: string, model: string) {
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
  } else {
    // Default to llama
    const result = await aiCompletion(enhancedPrompt);
    const responseText = result.choices?.[0]?.message?.content || 'No response received';
    return {
      guide: responseText,
      model: 'llama-4-hackclub',
      timestamp: new Date().toISOString(),
      tokens: {
        input: 0,
        output: 0,
        total: 0
      }
    };
  }
}
