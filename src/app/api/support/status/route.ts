import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock support status - in real app, this would check actual support availability
    const isOnline = Math.random() > 0.3; // 70% chance of being online

    return NextResponse.json({ 
      online: isOnline,
      averageResponseTime: '2 minutes',
      availableHours: '9 AM - 6 PM EST'
    });
  } catch (error) {
    console.error('Error checking support status:', error);
    return NextResponse.json(
      { error: 'Failed to check support status' },
      { status: 500 }
    );
  }
}
