import { NextResponse } from 'next/server';

// 410 Gone stub – team management operations removed.
export async function GET() {
  return NextResponse.json({ error: 'Team features removed' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: 'Team features removed' }, { status: 410 });
}
