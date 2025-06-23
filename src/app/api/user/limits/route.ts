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
      lastExport: userLimits.lastExport,
      limits: {
        llamaMax: RATE_LIMITS.USER_LLAMA_LIMIT,
        geminiMax: RATE_LIMITS.USER_GEMINI_LIMIT,
        exportCooldown: RATE_LIMITS.EXPORT_COOLDOWN,
      },
      remaining: {
        llama: RATE_LIMITS.USER_LLAMA_LIMIT - userLimits.llamaGuides,
        gemini: RATE_LIMITS.USER_GEMINI_LIMIT - userLimits.geminiGuides,
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
