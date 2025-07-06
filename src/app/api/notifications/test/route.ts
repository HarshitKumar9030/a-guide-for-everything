import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Create some sample notifications for testing
    const sampleNotifications = [
      {
        userId: session.user.id,
        userEmail: session.user.email,
        type: 'team',
        title: 'Welcome to Team Sharing! 🎉',
        message: 'You now have access to Pro+ team collaboration features. Start by inviting team members to collaborate on guides.',
        read: false,
        createdAt: new Date(),
        data: {
          feature: 'team_sharing'
        }
      },
      {
        userId: session.user.id,
        userEmail: session.user.email,
        type: 'collaboration',
        title: 'Collaboration Features Unlocked',
        message: 'Real-time collaborative editing is now available. Work together with your team on guides in real-time.',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        data: {
          feature: 'collaborative_editor'
        }
      },
      {
        userId: session.user.id,
        userEmail: session.user.email,
        type: 'system',
        title: 'Pro+ Plan Active',
        message: 'Your Pro+ plan is now active with all premium features including team sharing, advanced AI models, and priority support.',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        data: {
          plan: 'proplus'
        }
      }
    ];

    await db.collection('notifications').insertMany(sampleNotifications);

    return NextResponse.json({ 
      message: 'Sample notifications created',
      count: sampleNotifications.length
    });

  } catch (error) {
    console.error('Error creating sample notifications:', error);
    return NextResponse.json(
      { error: 'Failed to create notifications' },
      { status: 500 }
    );
  }
}
