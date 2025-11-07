import { NextResponse } from 'next/server';

// 410 Gone stub – team invitation acceptance removed.
export async function POST() {
  return NextResponse.json({ error: 'Team features removed' }, { status: 410 });
}
