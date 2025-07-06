import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserLimits } from '@/lib/user-limits';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userLimits = await getUserLimits(session.user.email);

    return NextResponse.json({
      llamaGuides: userLimits.llamaGuides,
      geminiGuides: userLimits.geminiGuides,
      deepseekGuides: userLimits.deepseekGuides,
      gpt41miniGuides: userLimits.gpt41miniGuides,
      o3miniGuides: userLimits.o3miniGuides || 0,
      lastExport: userLimits.lastExport,
      limits: {
        llamaMax: RATE_LIMITS.USER_LLAMA_LIMIT,
        geminiMax: RATE_LIMITS.USER_GEMINI_LIMIT,
        deepseekMax: RATE_LIMITS.USER_DEEPSEEK_LIMIT,
        gpt41miniMax: RATE_LIMITS.USER_GPT41MINI_LIMIT,
        o3miniMax: RATE_LIMITS.USER_O3MINI_LIMIT,
        exportCooldown: RATE_LIMITS.EXPORT_COOLDOWN,
      },
      remaining: {
        llama: RATE_LIMITS.USER_LLAMA_LIMIT - userLimits.llamaGuides,
        gemini: RATE_LIMITS.USER_GEMINI_LIMIT - userLimits.geminiGuides,
        deepseek: RATE_LIMITS.USER_DEEPSEEK_LIMIT - userLimits.deepseekGuides,
        gpt41mini: RATE_LIMITS.USER_GPT41MINI_LIMIT - userLimits.gpt41miniGuides,
        o3mini: RATE_LIMITS.USER_O3MINI_LIMIT - (userLimits.o3miniGuides || 0),
      }
    });

  } catch (error) {
    console.error('Error fetching user limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch limits' },
      { status: 500 }
    );
  }
}
