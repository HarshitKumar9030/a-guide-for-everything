import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { uploadAvatar, deleteAvatar } from '@/lib/cloudinary-server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Get current user to check for existing avatar
    const user = await db.collection('users').findOne({
      email: session.user.email
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete existing avatar if it exists
    if (user.avatar?.public_id) {
      await deleteAvatar(user.avatar.public_id);
    }

    // Upload new avatar
    const uploadResult = await uploadAvatar(file, user._id.toString());

    // Update user record with new avatar
    await db.collection('users').updateOne(
      { email: session.user.email },
      { 
        $set: { 
          avatar: {
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
          },
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      message: 'Avatar updated successfully',
      avatar: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Get current user
    const user = await db.collection('users').findOne({
      email: session.user.email
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete avatar from Cloudinary if it exists
    if (user.avatar?.public_id) {
      await deleteAvatar(user.avatar.public_id);
    }

    // Remove avatar from user record
    await db.collection('users').updateOne(
      { email: session.user.email },
      { 
        $unset: { avatar: "" },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      message: 'Avatar removed successfully'
    });

  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    );
  }
}
