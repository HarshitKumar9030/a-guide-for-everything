import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGuidesCollection, SavedGuide } from '@/lib/guides-db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { title, content, nutshell, model, prompt, tokens, isPublic = false } = await req.json();

    if (!title || !content || !model || !prompt) {
      return NextResponse.json(
        { error: 'Title, content, model, and prompt are required' },
        { status: 400 }
      );
    }

    const guides = await getGuidesCollection();
    const guideId = uuidv4();
    
    const newGuide: SavedGuide = {
      id: guideId,
      title,
      content,
      nutshell,
      model,
      prompt,
      userId: session.user.id || session.user.email || '',
      userEmail: session.user.email || '',
      isPublic,
      tokens,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      likes: 0
    };

    const result = await guides.insertOne(newGuide);
    console.log('Guide saved with ID:', result.insertedId);

    return NextResponse.json({
      success: true,
      guideId,
      shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/guide/${guideId}`,
      message: 'Guide saved successfully'
    });

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

    return NextResponse.json({ guides: userGuides });

  } catch (error) {
    console.error('Get guides error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guides' },
      { status: 500 }
    );
  }
}
