import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPlan, getPlanLimits } from '@/lib/user-plan';
import { getUsage } from '@/lib/usage';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const planDoc = await getUserPlan(session.user.email);
  const limits = getPlanLimits(planDoc.plan);
  const usage = await getUsage(session.user.email);
  return NextResponse.json({ plan: planDoc.plan, limits, usage });
}
