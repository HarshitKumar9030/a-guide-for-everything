import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id;
    const userEmail = session.user.email;

    // Find team with the invitation
    const team = await db.collection('teams').findOne({
      'invitations.id': token,
      'invitations.email': userEmail,
      'invitations.status': 'pending'
    });

    if (!team) {
      return NextResponse.json({ 
        error: 'Invitation not found or already processed' 
      }, { status: 404 });
    }

    // Find the specific invitation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invitation = team.invitations?.find((inv: any) => 
      inv.id === token && inv.email === userEmail && inv.status === 'pending'
    );

    if (!invitation) {
      return NextResponse.json({ 
        error: 'Invitation not found' 
      }, { status: 404 });
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json({ 
        error: 'Invitation has expired' 
      }, { status: 400 });
    }

    // Check if user is already a member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAlreadyMember = team.members?.some((member: any) => 
      member.userId === userId || member.email === userEmail
    );

    if (isAlreadyMember) {
      return NextResponse.json({ 
        error: 'You are already a member of this team' 
      }, { status: 400 });
    }

    // Add user to team members and update invitation status
    const newMember = {
      userId,
      email: userEmail,
      name: session.user.name,
      role: 'member',
      joinedAt: new Date(),
      status: 'active'
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invitationIndex = team.invitations.findIndex((inv: any) => inv.id === token);

    // Update team: add member and mark invitation as accepted
    await db.collection('teams').updateOne(
      { _id: team._id },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        $push: { members: newMember } as any,
        $set: { 
          [`invitations.${invitationIndex}.status`]: 'accepted',
          [`invitations.${invitationIndex}.acceptedAt`]: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the team',
      team: {
        id: team._id,
        name: team.name,
        memberCount: (team.members?.length || 0) + 1
      }
    });

  } catch (error) {
    console.error('Error accepting team invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
