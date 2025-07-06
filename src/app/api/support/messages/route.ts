import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Get support messages for this user
    const messages = await db.collection('support_messages').find({
      userId: new ObjectId(session.user.id)
    }).sort({ timestamp: 1 }).toArray();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching support messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Save user message
    const message = {
      userId: new ObjectId(session.user.id),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent',
    };

    await db.collection('support_messages').insertOne(message);

    // TODO: Integrate with live chat system (WebSocket, etc.)
    // TODO: Notify support team

    return NextResponse.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending support message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
