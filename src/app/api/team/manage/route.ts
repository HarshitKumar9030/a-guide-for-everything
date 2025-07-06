import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUserPlan } from '@/lib/user-plan';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPlan = await getUserPlan(session.user.email);
    if (userPlan.plan !== 'proplus') {
      return NextResponse.json({ error: 'Pro+ plan required' }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id;

    // Get team data
    let team = await db.collection('teams').findOne({ ownerId: userId });
    
    if (!team) {
      // Create default team
      const newTeamData = {
        ownerId: userId,
        name: `${session.user.name}'s Team`,
        members: [],
        invitations: [],
        createdAt: new Date(),
        settings: {
          allowMemberInvites: false,
          defaultPermissions: 'view'
        }
      };
      
      const result = await db.collection('teams').insertOne(newTeamData);
      team = { ...newTeamData, _id: result.insertedId };
    }

    // Get member details if any members exist
    let membersWithRoles = [];
    if (team.members && team.members.length > 0) {
      const memberIds = team.members.map((m: { userId: string }) => new ObjectId(m.userId));
      const members = await db.collection('users').find({
        _id: { $in: memberIds }
      }).project({
        password: 0,
        emailVerificationToken: 0,
        passwordResetToken: 0
      }).toArray();

      membersWithRoles = members.map(member => {
        const teamMember = team.members.find((m: { userId: string; role?: string; joinedAt?: Date; permissions?: string[] }) => 
          m.userId === member._id.toString()
        );
        return {
          ...member,
          role: teamMember?.role || 'member',
          joinedAt: teamMember?.joinedAt,
          permissions: teamMember?.permissions || ['view']
        };
      });
    }

    return NextResponse.json({
      team,
      members: membersWithRoles,
      invitations: team.invitations || []
    });
  } catch (error) {
    console.error('Team fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPlan = await getUserPlan(session.user.email);
    if (userPlan.plan !== 'proplus') {
      return NextResponse.json({ error: 'Pro+ plan required' }, { status: 403 });
    }

    const { action, ...data } = await request.json();
    const { db } = await connectToDatabase();
    const userId = session.user.id;

    switch (action) {
      case 'invite_member': {
        const { email, role = 'member', permissions = ['view'] } = data;
        
        // Check if user exists
        const existingUser = await db.collection('users').findOne({ email });
        if (!existingUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check team and existing members/invitations
        const team = await db.collection('teams').findOne({ ownerId: userId });
        if (team?.members?.some((m: { userId: string }) => m.userId === existingUser._id.toString())) {
          return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
        }

        if (team?.invitations?.some((i: { email: string }) => i.email === email)) {
          return NextResponse.json({ error: 'User is already invited' }, { status: 400 });
        }

        const invitation = {
          id: new ObjectId().toString(),
          email,
          role,
          permissions,
          invitedAt: new Date(),
          invitedBy: userId,
          status: 'pending'
        };

        await db.collection('teams').updateOne(
          { ownerId: userId },
          { $push: { invitations: invitation } }
        );

        return NextResponse.json({ success: true, invitation });
      }

      case 'remove_member': {
        const { memberId } = data;
        
        await db.collection('teams').updateOne(
          { ownerId: userId },
          { $pull: { members: { userId: memberId } } }
        );

        return NextResponse.json({ success: true });
      }

      case 'update_member_role': {
        const { memberId, role, permissions } = data;
        
        await db.collection('teams').updateOne(
          { ownerId: userId, 'members.userId': memberId },
          { 
            $set: { 
              'members.$.role': role,
              'members.$.permissions': permissions
            }
          }
        );

        return NextResponse.json({ success: true });
      }

      case 'accept_invitation': {
        const { invitationId } = data;
        
        const team = await db.collection('teams').findOne({
          'invitations.id': invitationId
        });

        if (!team) {
          return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        const invitation = team.invitations.find((i: { id: string; email: string; role: string; permissions: string[] }) => 
          i.id === invitationId
        );
        
        if (!invitation || invitation.email !== session.user.email) {
          return NextResponse.json({ error: 'Invalid invitation' }, { status: 403 });
        }

        const newMember = {
          userId: userId,
          role: invitation.role,
          permissions: invitation.permissions,
          joinedAt: new Date()
        };

        await db.collection('teams').updateOne(
          { _id: team._id },
          {
            $push: { members: newMember },
            $pull: { invitations: { id: invitationId } }
          }
        );

        return NextResponse.json({ success: true });
      }

      case 'decline_invitation': {
        const { invitationId } = data;
        
        await db.collection('teams').updateOne(
          { 'invitations.id': invitationId },
          { $pull: { invitations: { id: invitationId } } }
        );

        return NextResponse.json({ success: true });
      }

      case 'update_settings': {
        const { settings } = data;
        
        await db.collection('teams').updateOne(
          { ownerId: userId },
          { $set: { settings } }
        );

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Team management error:', error);
    return NextResponse.json(
      { error: 'Failed to perform team action' },
      { status: 500 }
    );
  }
}
