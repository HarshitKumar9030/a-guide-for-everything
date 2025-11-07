import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserLimits } from '@/lib/user-limits';
import { getUserPlan, getPlanLimits } from '@/lib/user-plan';

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
    const userPlan = await getUserPlan(session.user.email);
    const planLimits = getPlanLimits(userPlan.plan);

    const maxLimits = {
      llamaMax: planLimits.llama === -1 ? 999999 : planLimits.llama,
      geminiMax: planLimits.gemini === -1 ? 999999 : planLimits.gemini,
      deepseekMax: planLimits.deepseek === -1 ? 999999 : planLimits.deepseek,
      gpt41Max: planLimits.gpt41 === -1 ? 999999 : planLimits.gpt41,
      gpt41miniMax: planLimits.gpt41mini === -1 ? 999999 : planLimits.gpt41mini,
      o3miniMax: planLimits.o3mini === -1 ? 999999 : planLimits.o3mini,
      osslargeMax: planLimits.osslarge === -1 ? 999999 : planLimits.osslarge,
      nanobananaMax: planLimits.nanobanana === -1 ? 999999 : planLimits.nanobanana,
      exportCooldown: planLimits.exportCooldownHours * 60 * 60 * 1000,
    };

    const remaining = {
      llama: planLimits.llama === -1 ? 999999 : Math.max(0, planLimits.llama - userLimits.llamaGuides),
      gemini: planLimits.gemini === -1 ? 999999 : Math.max(0, planLimits.gemini - userLimits.geminiGuides),
      deepseek: planLimits.deepseek === -1 ? 999999 : Math.max(0, planLimits.deepseek - userLimits.deepseekGuides),
      gpt41: planLimits.gpt41 === -1 ? 999999 : Math.max(0, planLimits.gpt41 - userLimits.gpt41Guides),
      gpt41mini: planLimits.gpt41mini === -1 ? 999999 : Math.max(0, planLimits.gpt41mini - userLimits.gpt41miniGuides),
      o3mini: planLimits.o3mini === -1 ? 999999 : Math.max(0, planLimits.o3mini - (userLimits.o3miniGuides || 0)),
      osslarge: planLimits.osslarge === -1 ? 999999 : Math.max(0, planLimits.osslarge - (userLimits.osslargeGuides || 0)),
      nanobanana: planLimits.nanobanana === -1 ? 999999 : Math.max(0, planLimits.nanobanana - (userLimits.nanobananaGuides || 0)),
    };

    return NextResponse.json({
      llamaGuides: userLimits.llamaGuides,
      geminiGuides: userLimits.geminiGuides,
      deepseekGuides: userLimits.deepseekGuides,
      gpt41Guides: userLimits.gpt41Guides,
      gpt41miniGuides: userLimits.gpt41miniGuides,
    o3miniGuides: userLimits.o3miniGuides || 0,
    osslargeGuides: userLimits.osslargeGuides || 0,
    nanobananaGuides: userLimits.nanobananaGuides || 0,
      lastExport: userLimits.lastExport,
      plan: userPlan.plan,
      limits: maxLimits,
      remaining: remaining
    });

  } catch (error) {
    console.error('Error fetching user limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch limits' },
      { status: 500 }
    );
  }
}
