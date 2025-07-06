import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGuidesCollection, SavedGuide } from '@/lib/guides-db';
import { getUserTeamMembers } from '@/lib/team';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { 
      title, 
      content = '', 
      nutshell, 
      model = 'collaborative-guide', 
      prompt = 'User created guide', 
      tokens, 
      isPublic = false,
      collaborative = false,
      tags = [],
      folderId,
      folderPath
    } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const guides = await getGuidesCollection();
    const userId = session.user.id || session.user.email || '';
    
    // If collaborative, automatically share with team members
    let sharedWith: string[] = [];
    if (collaborative) {
      try {
        const teamMembers = await getUserTeamMembers(session.user.email || '');
        sharedWith = teamMembers.map(member => member.email);
        console.log('Auto-sharing collaborative guide with team members:', sharedWith);
      } catch (error) {
        console.error('Error fetching team members for collaborative guide:', error);
        // Continue without sharing if team fetch fails
      }
    }
    
    const newGuide: SavedGuide = {
      title,
      content,
      nutshell,
      model,
      prompt,
      userId,
      userEmail: session.user.email || '',
      isPublic,
      collaborative,
      sharedWith,
      tags,
      folderId,
      folderPath,
      tokens,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0
    };

    const result = await guides.insertOne(newGuide);
    console.log('Guide saved with ID:', result.insertedId);

    // Return the guide with the MongoDB _id
    const savedGuide = { ...newGuide, _id: result.insertedId.toString() };

    return NextResponse.json(savedGuide);

  } catch (error) {
    console.error('Save guide error:', error);
    return NextResponse.json(
      { error: 'Failed to save guide' },
      { status: 500 }
    );
  }
}

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
    const userId = session.user.id || session.user.email || '';
    const userGuides = await guides.find({
      userId: userId
    }).sort({ createdAt: -1 }).toArray();

    // Convert MongoDB _id to string and ensure proper format
    const formattedGuides = userGuides.map(guide => ({
      ...guide,
      _id: guide._id?.toString() || ''
    }));

    return NextResponse.json({ guides: formattedGuides });

  } catch (error) {
    console.error('Get guides error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guides' },
      { status: 500 }
    );
  }
}
