import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserPlan } from '@/lib/user-plan';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPlan = await getUserPlan(session.user.email);
    if (userPlan.plan !== 'proplus') {
      return NextResponse.json({ error: 'Pro+ plan required for team features' }, { status: 403 });
    }

    // Generate a shareable link for team collaboration
    const shareLink = `${process.env.NEXTAUTH_URL}/team/join/${session.user.id}?token=${generateShareToken()}`;

    return NextResponse.json({ link: shareLink });
  } catch (error) {
    console.error('Error generating share link:', error);
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 }
    );
  }
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
