import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getUserPlan } from '@/lib/user-plan';
import { sendEmail } from '@/lib/email';

interface TeamMember {
  userId: string;
  email: string;
  role: string;
  joinedAt: Date;
}

interface TeamInvitation {
  id: string;
  email: string;
  invitedBy: string;
  status: string;
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST to invite team members.' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userPlan = await getUserPlan(session.user.email);
    if (userPlan.plan !== 'proplus') {
      return NextResponse.json({ error: 'Pro+ plan required for team features' }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Prevent self-invitation
    if (email.toLowerCase() === session.user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot invite yourself to the team' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id;

    // Check if user exists (removing unused variable)
    // const existingUser = await db.collection('users').findOne({ email });
    
    // Get or create team
    let team = await db.collection('teams').findOne({ ownerId: userId });
    if (!team) {
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

    // Check if already invited or is a member
    const isAlreadyMember = team.members?.some((m: TeamMember) => m.email === email);
    const isAlreadyInvited = team.invitations?.some((inv: TeamInvitation) => inv.email === email && inv.status === 'pending');

    if (isAlreadyMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
    }

    if (isAlreadyInvited) {
      return NextResponse.json({ error: 'User already has a pending invitation' }, { status: 400 });
    }

    // Create invitation
    const invitation = {
      id: new ObjectId().toString(),
      email,
      invitedBy: userId,
      invitedByName: session.user.name,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      role: 'member'
    };

    // Update team with new invitation
    const currentInvitations = team.invitations || [];
    await db.collection('teams').findOneAndUpdate(
      { _id: team._id },
      { $set: { invitations: [...currentInvitations, invitation] } },
      { returnDocument: 'after' }
    );

    // Send invitation email
    try {
      const inviteLink = `${process.env.NEXTAUTH_URL}/team/accept-invite?token=${invitation.id}`;
      
      await sendEmail({
        to: email,
        subject: `You're invited to join ${session.user.name}'s team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Team Invitation</h2>
            <p>Hi there!</p>
            <p><strong>${session.user.name}</strong> has invited you to join their team for collaborative guide editing.</p>
            <p>Click the button below to accept the invitation:</p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
              Accept Invitation
            </a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${inviteLink}</p>
            <p>This invitation will expire in 7 days.</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue even if email fails - user can still use the share link
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        createdAt: invitation.createdAt
      }
    });

  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
