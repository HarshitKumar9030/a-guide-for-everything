import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGuidesCollection } from '@/lib/guides-db';
import { getUserTeamMembers, TeamMember } from '@/lib/team';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const guides = await getGuidesCollection();
    const userEmail = session.user.email || '';
    
    // Get user's team members
    const teamMembers: TeamMember[] = await getUserTeamMembers(userEmail);
    const teamMemberEmails = teamMembers.map((member: TeamMember) => member.email);
    
    // Find collaborative guides that are either:
    // 1. Created by the user
    // 2. Created by team members
    // 3. Explicitly shared with the user
    const collaborativeGuides = await guides.find({
      $and: [
        { collaborative: true },
        {
          $or: [
            { userEmail: userEmail }, // User's own guides
            { userEmail: { $in: teamMemberEmails } }, // Team member guides
            { sharedWith: { $in: [userEmail] } }, // Explicitly shared guides
            { isPublic: true } // Public collaborative guides
          ]
        }
      ]
    }).sort({ updatedAt: -1 }).toArray();

    // Format guides for response and add ownership info
    const formattedGuides = collaborativeGuides.map(guide => ({
      ...guide,
      _id: guide._id?.toString() || '',
      isOwn: guide.userEmail === userEmail,
      canEdit: guide.userEmail === userEmail || guide.sharedWith?.includes(userEmail),
      owner: {
        email: guide.userEmail,
        isTeamMember: teamMemberEmails.includes(guide.userEmail)
      }
    }));

    return NextResponse.json({ 
      guides: formattedGuides,
      totalGuides: formattedGuides.length,
      ownGuides: formattedGuides.filter(g => g.isOwn).length,
      teamGuides: formattedGuides.filter(g => !g.isOwn && g.owner.isTeamMember).length,
      sharedGuides: formattedGuides.filter(g => !g.isOwn && !g.owner.isTeamMember).length
    });

  } catch (error) {
    console.error('Get collaborative guides error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborative guides' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { guideId, shareWith, shareType } = await req.json();
    
    if (!guideId || !shareWith) {
      return NextResponse.json(
        { error: 'Guide ID and share target are required' },
        { status: 400 }
      );
    }

    const guides = await getGuidesCollection();
    
    // Find the guide
    const guide = await guides.findOne({ _id: guideId });
    
    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // Check if user owns the guide
    const isOwner = guide.userEmail === session.user.email;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to share this guide' },
        { status: 403 }
      );
    }

    // Update guide sharing
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (shareType === 'team') {
      // Share with team members
      const teamMembers = await getUserTeamMembers(session.user.email || '');
      const teamEmails = teamMembers.map((member: TeamMember) => member.email);
      updateData.sharedWith = [...(guide.sharedWith || []), ...teamEmails];
      updateData.teamId = 'user-team'; // You might want to implement proper team IDs
    } else if (shareType === 'email') {
      // Share with specific email
      updateData.sharedWith = [...(guide.sharedWith || []), shareWith];
    } else if (shareType === 'public') {
      // Make guide public
      updateData.isPublic = true;
    }

    // Remove duplicates from sharedWith
    if (updateData.sharedWith && Array.isArray(updateData.sharedWith)) {
      updateData.sharedWith = [...new Set(updateData.sharedWith)];
    }

    await guides.updateOne(
      { _id: guideId },
      { $set: updateData }
    );

    // Fetch updated guide
    const updatedGuide = await guides.findOne({ _id: guideId });

    return NextResponse.json({
      success: true,
      guide: { ...updatedGuide, _id: updatedGuide?._id?.toString() },
      message: `Guide shared ${shareType === 'team' ? 'with team' : shareType === 'public' ? 'publicly' : 'with ' + shareWith}`
    });

  } catch (error) {
    console.error('Share guide error:', error);
    return NextResponse.json(
      { error: 'Failed to share guide' },
      { status: 500 }
    );
  }
}
