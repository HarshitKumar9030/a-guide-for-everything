import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGuidesCollection } from '@/lib/guides-db';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const guides = await getGuidesCollection();
    
    // Try to find by MongoDB _id first, then by custom id field for backwards compatibility
    let guide;
    try {
      if (ObjectId.isValid(id)) {
        guide = await guides.findOne({ _id: new ObjectId(id) });
      }
      if (!guide) {
        guide = await guides.findOne({ id });
      }
    } catch (_error) {
      // If ObjectId conversion fails, try finding by custom id field
      guide = await guides.findOne({ id });
    }
    
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
      const updateQuery = guide._id ? { _id: guide._id } : { id: guide.id };
      await guides.updateOne(updateQuery, { $inc: { views: 1 } });
    }

    return NextResponse.json({ guide: { ...guide, _id: guide._id?.toString() } });

  } catch (error) {
    console.error('Get guide error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guide' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { content, title, isPublic, collaborative, tags } = await req.json();
    
    const guides = await getGuidesCollection();
    
    // Find guide by _id or custom id
    let guide;
    let updateQuery: { _id: ObjectId } | { id: string };
    
    try {
      if (ObjectId.isValid(id)) {
        guide = await guides.findOne({ _id: new ObjectId(id) });
        if (guide) {
          updateQuery = { _id: new ObjectId(id) };
        } else {
          guide = await guides.findOne({ id });
          updateQuery = { id };
        }
      } else {
        guide = await guides.findOne({ id });
        updateQuery = { id };
      }
    } catch (_error) {
      guide = await guides.findOne({ id });
      updateQuery = { id };
    }
    
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

    const updateData: Record<string, unknown> = { 
      updatedAt: new Date() 
    };
    
    if (content !== undefined) updateData.content = content;
    if (title !== undefined) updateData.title = title;
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;
    if (typeof collaborative === 'boolean') updateData.collaborative = collaborative;
    if (Array.isArray(tags)) updateData.tags = tags;

    await guides.updateOne(updateQuery, { $set: updateData });

    // Fetch updated guide
    const updatedGuide = await guides.findOne(updateQuery);

    return NextResponse.json({ 
      ...updatedGuide, 
      _id: updatedGuide?._id?.toString() 
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
    
    // Find guide by _id or custom id
    let guide;
    let deleteQuery: { _id: ObjectId } | { id: string };
    
    try {
      if (ObjectId.isValid(id)) {
        guide = await guides.findOne({ _id: new ObjectId(id) });
        if (guide) {
          deleteQuery = { _id: new ObjectId(id) };
        } else {
          guide = await guides.findOne({ id });
          deleteQuery = { id };
        }
      } else {
        guide = await guides.findOne({ id });
        deleteQuery = { id };
      }
    } catch (_error) {
      guide = await guides.findOne({ id });
      deleteQuery = { id };
    }
    
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

    await guides.deleteOne(deleteQuery);

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
