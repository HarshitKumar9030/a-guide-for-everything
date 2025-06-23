import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geminiCompletion } from '@/lib/ai/gemini';
import { aiCompletion } from '@/lib/ai/hackclub';
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
    } else {
      return NextResponse.json(
        { error: 'Invalid model specified. Use "gemini" or "llama".' },
        { status: 400 }
      );
    }

    if (session?.user?.email) {
      const userLimits = await getUserLimits(session.user.email);
      
      if (!checkUserGuideLimit(normalizedModel, {
        llamaGuides: userLimits.llamaGuides,
        geminiGuides: userLimits.geminiGuides,
        lastExport: userLimits.lastExport
      })) {
        const remaining = normalizedModel === 'llama' 
          ? RATE_LIMITS.USER_GEMINI_LIMIT - userLimits.geminiGuides
          : RATE_LIMITS.USER_LLAMA_LIMIT - userLimits.llamaGuides;
        
        return NextResponse.json(
          { 
            error: `You have reached your ${normalizedModel} guide limit. You have ${remaining} guides remaining for ${normalizedModel === 'llama' ? 'Gemini' : 'Llama'}.` 
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
          gemini: RATE_LIMITS.USER_GEMINI_LIMIT - userLimits.geminiGuides - (normalizedModel === 'gemini' ? 1 : 0)
        }
      });

    } else {
      if (normalizedModel !== 'llama') {
        return NextResponse.json(
          { error: 'Guest users can only use the Llama model. Please sign in to access Gemini.' },
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
      timestamp: result.timestamp
    };
  } else {
    const result = await aiCompletion(enhancedPrompt);
    const responseText = result.choices?.[0]?.message?.content || 'No response received';
    return {
      guide: responseText,
      model: 'llama-4-hackclub',
      timestamp: new Date().toISOString()
    };
  }
}
