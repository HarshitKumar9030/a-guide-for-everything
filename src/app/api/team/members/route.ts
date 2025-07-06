import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserPlan } from '@/lib/user-plan';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  joinedAt: Date;
  status: string;
  teamId: string;
  teamName: string;
}

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

    const { db } = await connectToDatabase();
    const userId = session.user.id;
    
    // Get team where user is owner or member
    const teams = await db.collection('teams').find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ]
    }).toArray();

    let allMembers: TeamMember[] = [];
    
    for (const team of teams) {
      // Add owner as member
      const owner = await db.collection('users').findOne({ _id: { $eq: team.ownerId } });
      if (owner) {
        allMembers.push({
          id: team.ownerId,
          email: owner.email,
          name: owner.name,
          role: 'owner',
          joinedAt: team.createdAt,
          status: 'active',
          teamId: team._id.toString(),
          teamName: team.name
        });
      }

      // Add regular members
      if (team.members && team.members.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memberDetails = team.members.map((member: any) => ({
          id: member.userId,
          email: member.email,
          name: member.name,
          role: member.role || 'member',
          joinedAt: member.joinedAt,
          status: member.status || 'active',
          teamId: team._id.toString(),
          teamName: team.name
        }));
        allMembers = allMembers.concat(memberDetails);
      }
    }

    // Remove duplicates based on email
    const uniqueMembers = allMembers.filter((member, index, self) => 
      index === self.findIndex((m) => m.email === member.email)
    );

    return NextResponse.json({ 
      members: uniqueMembers,
      totalTeams: teams.length 
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
