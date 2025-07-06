import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserPlan } from '@/lib/user-plan';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPlan = await getUserPlan(session.user.email);
    if (userPlan.plan !== 'proplus') {
      return NextResponse.json({ error: 'Pro+ plan required for team features' }, { status: 403 });
    }

    const { memberId } = await params;
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id;

    // Find the team where user is owner
    const team = await db.collection('teams').findOne({ ownerId: userId });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if the member exists in the team
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memberExists = team.members?.some((member: any) => member.userId === memberId);
    if (!memberExists) {
      return NextResponse.json({ error: 'Member not found in team' }, { status: 404 });
    }

    // Remove member from team by filtering the array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedMembers = team.members?.filter((member: any) => member.userId !== memberId) || [];
    
    await db.collection('teams').updateOne(
      { _id: team._id },
      { $set: { members: updatedMembers } }
    );

    return NextResponse.json({
      success: true,
      message: 'Member removed from team successfully'
    });

  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
