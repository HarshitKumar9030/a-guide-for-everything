import { NextResponse } from 'next/server';

// Socket.IO server is now running on the custom server
export async function GET() {
  return NextResponse.json({ 
    status: 'Socket.IO server running on custom server',
    message: 'Real-time collaboration is available',
    endpoint: '/',
    note: 'Start the server with "npm run dev" to enable real-time features'
  });
}

export async function POST() {
  return NextResponse.json({ 
    status: 'Method not allowed',
    message: 'Use GET for Socket.IO server status'
  }, { status: 405 });
}
