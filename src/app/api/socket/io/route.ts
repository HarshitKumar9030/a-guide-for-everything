import { NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import type { Server } from 'http';

// Global variables to store the server instances
let io: SocketIOServer | undefined;
let httpServer: Server | undefined;

const guideConnections = new Map<string, Set<string>>();
const userSessions = new Map<string, { 
  id: string; 
  name: string; 
  email: string; 
  image?: string; 
  guideId: string;
}>();

function initializeSocketIO() {
  if (io) return io;

  try {
    // Create HTTP server for Socket.IO
    httpServer = createServer();
    
    io = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      const { guideId, userId, userName, userImage } = socket.handshake.query;
      
      if (!guideId || !userId) {
        socket.disconnect();
        return;
      }

      // Store user session
      userSessions.set(socket.id, {
        id: userId as string,
        name: userName as string,
        email: userId as string,
        image: userImage as string,
        guideId: guideId as string
      });

      // Add to guide connections
      if (!guideConnections.has(guideId as string)) {
        guideConnections.set(guideId as string, new Set());
      }
      guideConnections.get(guideId as string)?.add(socket.id);

      // Join guide room
      socket.join(guideId as string);

      // Notify other users in the guide
      socket.to(guideId as string).emit('user-joined', {
        id: userId,
        name: userName,
        email: userId,
        image: userImage
      });

      // Send current users to the new user
      const currentUsers = Array.from(guideConnections.get(guideId as string) || [])
        .map(socketId => userSessions.get(socketId))
        .filter(Boolean)
        .filter(user => user?.id !== userId);

      currentUsers.forEach(user => {
        socket.emit('user-joined', user);
      });

      // Handle content changes
      socket.on('content-change', (data: { content: string; version: number; guideId: string }) => {
        const { content, version, guideId: targetGuideId } = data;
        
        if (targetGuideId === guideId) {
          socket.to(guideId as string).emit('content-changed', {
            content,
            version,
            userId: userId as string
          });
        }
      });

      // Handle cursor movements
      socket.on('cursor-move', (data: { cursor: number; selection?: { start: number; end: number }; guideId: string }) => {
        const { cursor, selection, guideId: targetGuideId } = data;
        
        if (targetGuideId === guideId) {
          socket.to(guideId as string).emit('cursor-moved', {
            userId: userId as string,
            cursor,
            selection
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        const userSession = userSessions.get(socket.id);
        if (userSession) {
          // Remove from guide connections
          guideConnections.get(userSession.guideId)?.delete(socket.id);
          
          // Clean up empty guide rooms
          if (guideConnections.get(userSession.guideId)?.size === 0) {
            guideConnections.delete(userSession.guideId);
          }

          // Notify other users
          socket.to(userSession.guideId).emit('user-left', userSession.id);
          
          // Remove user session
          userSessions.delete(socket.id);
        }
      });
    });

    // Start the server on a dynamic port for development
    if (process.env.NODE_ENV === 'development') {
      httpServer.listen(0, () => {
        const address = httpServer?.address();
        if (address && typeof address === 'object') {
          console.log('Socket.IO server started on port:', address.port);
        }
      });
    }

    console.log('Socket.IO server initialized');
    return io;
  } catch (error) {
    console.error('Failed to initialize Socket.IO:', error);
    return undefined;
  }
}

export async function GET() {
  // Initialize Socket.IO if not already done
  const socketServer = initializeSocketIO();
  
  if (!socketServer) {
    return NextResponse.json(
      { error: 'Failed to initialize Socket.IO server' },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    message: 'Socket.IO server is running',
    status: 'connected',
    connectedUsers: userSessions.size,
    activeGuides: guideConnections.size
  });
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
