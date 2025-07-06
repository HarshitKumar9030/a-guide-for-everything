import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFoldersCollection } from '@/lib/guides-db';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const folders = await getFoldersCollection();
    
    // Try to find by MongoDB _id first, then by custom id field
    let folder;
    try {
      if (ObjectId.isValid(id)) {
        folder = await folders.findOne({ _id: new ObjectId(id) });
      }
      if (!folder) {
        folder = await folders.findOne({ id });
      }
    } catch (_error) {
      folder = await folders.findOne({ id });
    }
    
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const hasAccess = folder.userId === (session.user.id || session.user.email) ||
                     folder.sharedWith?.includes(session.user.email || '') ||
                     folder.isShared;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ 
      folder: { ...folder, _id: folder._id?.toString() } 
    });

  } catch (error) {
    console.error('Get folder error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
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
    const { name, color, icon, isShared, sharedWith } = await req.json();
    
    const folders = await getFoldersCollection();
    
    // Find folder
    let folder;
    let updateQuery: { _id: ObjectId } | { id: string };
    
    try {
      if (ObjectId.isValid(id)) {
        folder = await folders.findOne({ _id: new ObjectId(id) });
        if (folder) {
          updateQuery = { _id: new ObjectId(id) };
        } else {
          folder = await folders.findOne({ id });
          updateQuery = { id };
        }
      } else {
        folder = await folders.findOne({ id });
        updateQuery = { id };
      }
    } catch (_error) {
      folder = await folders.findOne({ id });
      updateQuery = { id };
    }
    
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Check if user owns the folder
    const isOwner = folder.userId === (session.user.id || session.user.email);
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to update this folder' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = { 
      updatedAt: new Date() 
    };
    
    if (name !== undefined) {
      updateData.name = name;
      // Update path if name changed
      if (folder.parentId) {
        const parentFolder = await folders.findOne({ _id: new ObjectId(folder.parentId) });
        updateData.path = parentFolder ? `${parentFolder.path}/${name}` : name;
      } else {
        updateData.path = name;
      }
    }
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (typeof isShared === 'boolean') updateData.isShared = isShared;
    if (Array.isArray(sharedWith)) updateData.sharedWith = sharedWith;

    await folders.updateOne(updateQuery, { $set: updateData });

    // Fetch updated folder
    const updatedFolder = await folders.findOne(updateQuery);

    return NextResponse.json({ 
      ...updatedFolder, 
      _id: updatedFolder?._id?.toString() 
    });

  } catch (error) {
    console.error('Update folder error:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
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
    const folders = await getFoldersCollection();
    
    // Find folder
    let folder;
    let deleteQuery: { _id: ObjectId } | { id: string };
    
    try {
      if (ObjectId.isValid(id)) {
        folder = await folders.findOne({ _id: new ObjectId(id) });
        if (folder) {
          deleteQuery = { _id: new ObjectId(id) };
        } else {
          folder = await folders.findOne({ id });
          deleteQuery = { id };
        }
      } else {
        folder = await folders.findOne({ id });
        deleteQuery = { id };
      }
    } catch (_error) {
      folder = await folders.findOne({ id });
      deleteQuery = { id };
    }
    
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Check if user owns the folder
    const isOwner = folder.userId === (session.user.id || session.user.email);
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to delete this folder' },
        { status: 403 }
      );
    }

    // Check if folder has subfolders or guides
    const hasSubfolders = await folders.countDocuments({ parentId: folder._id?.toString() || folder.id });
    if (hasSubfolders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder that contains subfolders. Please delete or move subfolders first.' },
        { status: 400 }
      );
    }

    await folders.deleteOne(deleteQuery);

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully'
    });

  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
