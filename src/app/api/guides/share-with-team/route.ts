import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGuidesCollection } from '@/lib/guides-db';
import { getUserTeamMembers } from '@/lib/team';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { guideId } = await req.json();
    
    if (!guideId) {
      return NextResponse.json(
        { error: 'Guide ID is required' },
        { status: 400 }
      );
    }

    const guides = await getGuidesCollection();
    
    // Find the guide
    const guide = await guides.findOne({ _id: new ObjectId(guideId) });
    
    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // Check if user owns the guide
    const userEmail = session.user.email || '';
    const isOwner = guide.userEmail === userEmail;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to share this guide' },
        { status: 403 }
      );
    }

    // Get team members
    const teamMembers = await getUserTeamMembers(userEmail);
    const teamEmails = teamMembers.map(member => member.email);
    
    if (teamEmails.length === 0) {
      return NextResponse.json(
        { error: 'No team members found to share with' },
        { status: 400 }
      );
    }

    // Update guide to share with team and make collaborative
    const updateData = {
      collaborative: true,
      sharedWith: [...new Set([...(guide.sharedWith || []), ...teamEmails])],
      updatedAt: new Date()
    };

    await guides.updateOne(
      { _id: new ObjectId(guideId) },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: `Guide shared with ${teamEmails.length} team members`,
      sharedWith: updateData.sharedWith,
      teamMembers
    });

  } catch (error) {
    console.error('Share with team error:', error);
    return NextResponse.json(
      { error: 'Failed to share guide with team' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to share a guide with team members',
    body: { guideId: 'string' }
  });
}
