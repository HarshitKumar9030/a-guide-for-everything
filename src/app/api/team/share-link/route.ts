import { NextResponse } from 'next/server';

// 410 Gone stub – share link feature removed.
export async function GET() {
  return NextResponse.json({ error: 'Team features removed' }, { status: 410 });
}
