import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface TeamMember {
  userId: string;
  email: string;
  role: string;
  joinedAt: Date;
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST to join a team.' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, token } = await request.json();
    if (!teamId || !token) {
      return NextResponse.json({ error: 'Team ID and token are required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id;
    const userEmail = session.user.email;

    // Find the team
    const team = await db.collection('teams').findOne({ 
      ownerId: teamId 
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Verify the token (simple token validation for now)
    // In a real app, you'd have more sophisticated token verification
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 403 });
    }

    // Check if user is already a member
    const isOwner = team.ownerId === userId;
    const isAlreadyMember = team.members?.some((member: TeamMember) => 
      member.userId === userId || member.email === userEmail
    );

    if (isOwner || isAlreadyMember) {
      return NextResponse.json({ 
        message: 'Already a member of this team',
        teamName: team.name 
      }, { status: 409 });
    }

    // Add user to team
    const newMember: TeamMember = {
      userId,
      email: userEmail,
      role: 'member',
      joinedAt: new Date()
    };

    const currentMembers = team.members || [];
    const updatedMembers = [...currentMembers, newMember];

    await db.collection('teams').updateOne(
      { _id: team._id },
      { 
        $set: { 
          members: updatedMembers,
          updatedAt: new Date()
        }
      }
    );

    // Create notification for team owner
    const owner = await db.collection('users').findOne({ _id: new ObjectId(team.ownerId) });
    if (owner?.email) {
      await db.collection('notifications').insertOne({
        userId: team.ownerId,
        userEmail: owner.email,
        type: 'team_member_joined',
        title: 'New Team Member',
        message: `${session.user.name || userEmail} joined your team "${team.name}"`,
        data: {
          teamId: team._id.toString(),
          teamName: team.name,
          memberEmail: userEmail,
          memberName: session.user.name
        },
        read: false,
        createdAt: new Date()
      });
    }

    return NextResponse.json({ 
      message: 'Successfully joined team',
      teamName: team.name,
      teamId: team._id.toString()
    });

  } catch (error) {
    console.error('Error joining team:', error);
    return NextResponse.json(
      { error: 'Failed to join team' },
      { status: 500 }
    );
  }
}
