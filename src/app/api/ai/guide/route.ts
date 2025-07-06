import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geminiCompletion } from '@/lib/ai/gemini';
import { aiCompletion } from '@/lib/ai/hackclub';
import { deepseekCompletion } from '@/lib/ai/deepseek';
import { gpt41MiniCompletion } from '@/lib/ai/azure-gpt';
import { o3MiniCompletion } from '@/lib/ai/azure-o3mini';
import { getUserLimits, incrementGuideCount } from '@/lib/user-limits';
import { getGuestLimits, incrementGuestGuideCount, getClientIP } from '@/lib/guest-limits';
import { checkUserGuideLimit, checkGuestGuideLimit, RATE_LIMITS } from '@/lib/rate-limit';

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
    } else if (model === 'gpt-4.1-mini' || model === 'gpt41mini') {
      normalizedModel = 'gpt41mini';
    } else if (model === 'o3-mini' || model === 'o3mini') {
      normalizedModel = 'o3mini';
    } else {
      return NextResponse.json(
        { error: 'Invalid model specified. Use "gemini", "llama", "deepseek", "gpt41mini", or "o3mini".' },
        { status: 400 }
      );
    }

    if (session?.user?.email) {
      const userLimits = await getUserLimits(session.user.email);
      
      if (!checkUserGuideLimit(normalizedModel, {
        llamaGuides: userLimits.llamaGuides,
        geminiGuides: userLimits.geminiGuides,
        deepseekGuides: userLimits.deepseekGuides,
        gpt41miniGuides: userLimits.gpt41miniGuides,
        o3miniGuides: userLimits.o3miniGuides,
        lastExport: userLimits.lastExport
      })) {
        let remaining = 0;
        let remainingModel = '';
        
        if (normalizedModel === 'llama') {
          remaining = RATE_LIMITS.USER_GEMINI_LIMIT - userLimits.geminiGuides;
          remainingModel = 'Gemini';
        } else if (normalizedModel === 'gemini') {
          remaining = RATE_LIMITS.USER_LLAMA_LIMIT - userLimits.llamaGuides;
          remainingModel = 'Llama';
        } else if (normalizedModel === 'deepseek') {
          remaining = RATE_LIMITS.USER_LLAMA_LIMIT - userLimits.llamaGuides;
          remainingModel = 'Llama';
        } else if (normalizedModel === 'gpt41mini') {
          remaining = RATE_LIMITS.USER_LLAMA_LIMIT - userLimits.llamaGuides;
          remainingModel = 'Llama';
        } else if (normalizedModel === 'o3mini') {
          remaining = RATE_LIMITS.USER_LLAMA_LIMIT - userLimits.llamaGuides;
          remainingModel = 'Llama';
        }
        
        return NextResponse.json(
          { 
            error: `You have reached your ${normalizedModel} guide limit. You have ${remaining} guides remaining for ${remainingModel}.` 
          },
          { status: 429 }
        );
      }

      const result = await generateGuide(prompt, normalizedModel);
      
      await incrementGuideCount(session.user.email, normalizedModel);

      return NextResponse.json({
        ...result,
        user: session.user.email,
        originalPrompt: prompt,
        remaining: {
          llama: RATE_LIMITS.USER_LLAMA_LIMIT - userLimits.llamaGuides - (normalizedModel === 'llama' ? 1 : 0),
          gemini: RATE_LIMITS.USER_GEMINI_LIMIT - userLimits.geminiGuides - (normalizedModel === 'gemini' ? 1 : 0),
          deepseek: RATE_LIMITS.USER_DEEPSEEK_LIMIT - userLimits.deepseekGuides - (normalizedModel === 'deepseek' ? 1 : 0),
          gpt41mini: RATE_LIMITS.USER_GPT41MINI_LIMIT - userLimits.gpt41miniGuides - (normalizedModel === 'gpt41mini' ? 1 : 0),
          o3mini: RATE_LIMITS.USER_O3MINI_LIMIT - userLimits.o3miniGuides - (normalizedModel === 'o3mini' ? 1 : 0)
        }
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
