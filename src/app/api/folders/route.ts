import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFoldersCollection, GuideFolder } from '@/lib/guides-db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const folders = await getFoldersCollection();
    const userId = session.user.id || session.user.email || '';
    
    // Get user's folders and folders shared with them
    const userEmail = session.user.email;
    const userFolders = await folders.find({
      $or: [
        { userId: userId },
        ...(userEmail ? [{ sharedWith: { $in: [userEmail] } }] : []),
        { isShared: true }
      ]
    }).sort({ path: 1 }).toArray();

    // Format folders for response
    const formattedFolders = userFolders.map(folder => ({
      ...folder,
      _id: folder._id?.toString() || ''
    }));

    return NextResponse.json({ folders: formattedFolders });

  } catch (error) {
    console.error('Get folders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
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

    const { 
      name, 
      parentId, 
      color = '#3B82F6', 
      icon = 'folder',
      isShared = false,
      sharedWith = []
    } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const folders = await getFoldersCollection();
    const userId = session.user.id || session.user.email || '';

    // Build folder path
    let path = name;
    if (parentId) {
      try {
        const parentFolder = parentId.length === 24 
          ? await folders.findOne({ _id: new ObjectId(parentId) })
          : await folders.findOne({ id: parentId });
        
        if (parentFolder) {
          path = `${parentFolder.path}/${name}`;
        }
      } catch (error) {
        console.error('Error finding parent folder:', error);
      }
    }

    // Check for duplicate folder names in the same parent
    const existingFolder = await folders.findOne({
      userId: userId,
      name: name,
      parentId: parentId || { $exists: false }
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 409 }
      );
    }

    const newFolder: GuideFolder = {
      name,
      parentId,
      path,
      userId,
      userEmail: session.user.email || '',
      color,
      icon,
      isShared,
      sharedWith,
      createdAt: new Date(),
      updatedAt: new Date(),
      guidesCount: 0
    };

    const result = await folders.insertOne(newFolder);
    const savedFolder = { ...newFolder, _id: result.insertedId.toString() };

    return NextResponse.json(savedFolder);

  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
