import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGuidesCollection } from '@/lib/guides-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const guides = await getGuidesCollection();
    
    const guide = await guides.findOne({ id });
    
    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);
    const isOwner = session?.user && (session.user.id === guide.userId || session.user.email === guide.userEmail);

    // If guide is private and user is not the owner, deny access
    if (!guide.isPublic && !isOwner) {
      return NextResponse.json(
        { error: 'Guide is private' },
        { status: 403 }
      );
    }

    // Increment view count if not the owner
    if (!isOwner) {
      await guides.updateOne(
        { id },
        { $inc: { views: 1 } }
      );
    }

    return NextResponse.json({ guide });

  } catch (error) {
    console.error('Get guide error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guide' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { isPublic, title } = await req.json();
    
    const guides = await getGuidesCollection();
    
    const guide = await guides.findOne({ id });
    
    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // Check if user owns the guide
    const isOwner = session.user.id === guide.userId || session.user.email === guide.userEmail;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to update this guide' },
        { status: 403 }
      );
    }

    const updateData: Partial<{ isPublic: boolean; title: string; updatedAt: Date }> = { 
      updatedAt: new Date() 
    };
    
    if (typeof isPublic === 'boolean') {
      updateData.isPublic = isPublic;
    }
    
    if (title) {
      updateData.title = title;
    }

    await guides.updateOne(
      { id },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: 'Guide updated successfully'
    });

  } catch (error) {
    console.error('Update guide error:', error);
    return NextResponse.json(
      { error: 'Failed to update guide' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const guides = await getGuidesCollection();
    
    const guide = await guides.findOne({ id });
    
    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      );
    }

    // Check if user owns the guide
    const isOwner = session.user.id === guide.userId || session.user.email === guide.userEmail;
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to delete this guide' },
        { status: 403 }
      );
    }

    await guides.deleteOne({ id });

    return NextResponse.json({
      success: true,
      message: 'Guide deleted successfully'
    });

  } catch (error) {
    console.error('Delete guide error:', error);
    return NextResponse.json(
      { error: 'Failed to delete guide' },
      { status: 500 }
    );
  }
}
