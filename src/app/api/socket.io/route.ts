import { NextRequest, NextResponse } from 'next/server';

// This is a working API route for Socket.IO status
// The actual Socket.IO server runs via custom server or external service

export async function GET(request: NextRequest) {
  // Check if the request is for Socket.IO polling
  const url = new URL(request.url);
  
  if (url.searchParams.has('EIO') && url.searchParams.has('transport')) {
    // This is a Socket.IO polling request
    // For now, return a 404 to indicate server is not available
    return new NextResponse('Socket.IO server not available via API routes', { 
      status: 404,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  // Regular API status request
  return NextResponse.json({
    message: 'Socket.IO API endpoint - use custom server for real-time features',
    status: 'available',
    note: 'Run "npm run dev:server" for real-time collaboration'
  });
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 });
}
