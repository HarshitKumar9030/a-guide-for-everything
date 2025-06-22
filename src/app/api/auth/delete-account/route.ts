import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { deleteAvatar } from '@/lib/cloudinary-server';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    const user = await db.collection('users').findOne({ 
      email: session.user.email 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }    // Delete avatar from Cloudinary if it exists and is a Cloudinary image
    if (user.image && user.image.includes('cloudinary.com') && user.image.includes('/avatars/')) {
      try {
        const matches = user.image.match(/\/avatars\/([^/.]+)/);
        if (matches?.[1]) {
          await deleteAvatar(`avatars/${matches[1]}`);
        }
      } catch (error) {
        console.error('Failed to delete avatar from Cloudinary:', error);
      }
    }

    const result = await db.collection('users').deleteOne({ 
      email: session.user.email 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
