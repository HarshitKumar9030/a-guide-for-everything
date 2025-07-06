import { NextResponse } from 'next/server';

// Simple health check for Socket.IO - actual Socket.IO runs on custom server
export async function GET() {
  return NextResponse.json({ 
    status: 'Socket.IO server running on custom server',
    message: 'Real-time collaboration is available at /',
    endpoint: '/'
  });
}

export async function POST() {
  return NextResponse.json({ 
    status: 'Socket.IO health check endpoint',
    message: 'Use GET method for health check'
  });
}
