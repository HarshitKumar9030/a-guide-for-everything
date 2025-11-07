import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listChatSessions, createChatSession } from '@/lib/chat';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const chats = await listChatSessions(session.user.email);
  return NextResponse.json({ chats });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { model, message } = await req.json();
  if (!model) return NextResponse.json({ error: 'model required' }, { status: 400 });
  const chat = await createChatSession(session.user.email, model, message);
  return NextResponse.json({ chat });
}
