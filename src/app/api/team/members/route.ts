import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Get user's team members
    const teamMembers = await db.collection('team_members').find({
      $or: [
        { ownerId: new ObjectId(session.user.id) },
        { memberId: new ObjectId(session.user.id) }
      ]
    }).toArray();

    return NextResponse.json({ members: teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Check if user exists
    const invitedUser = await db.collection('users').findOne({ email });
    
    if (!invitedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a team member
    const existingMember = await db.collection('team_members').findOne({
      ownerId: new ObjectId(session.user.id),
      memberId: invitedUser._id
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
    }

    // Create team invitation
    const invitation = {
      ownerId: new ObjectId(session.user.id),
      memberId: invitedUser._id,
      memberEmail: email,
      role: 'member',
      status: 'pending',
      createdAt: new Date(),
    };

    await db.collection('team_members').insertOne(invitation);

    // TODO: Send invitation email

    return NextResponse.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
