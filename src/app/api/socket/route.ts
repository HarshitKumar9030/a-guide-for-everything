import { NextRequest } from 'next/server';
import { Server as IOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Extend global to include io server
declare global {
  var io: IOServer | undefined;
}

// Map to store guide connections
const guideConnections = new Map<string, Set<string>>();
const userSessions = new Map<string, { 
  id: string; 
  name: string; 
  email: string; 
  image?: string; 
  guideId: string;
}>();

export async function GET(req: NextRequest) {
  if (!global.io) {
    console.log('Setting up Socket.IO server...');
    
    // Create HTTP server from Next.js
    const httpServer = new HTTPServer();
    
    // Create Socket.IO server
    global.io = new IOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    global.io.on('connection', (socket) => {
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
        .filter(user => user.id !== userId);

      currentUsers.forEach(user => {
        socket.emit('user-joined', user);
      });

      // Handle content changes
      socket.on('content-change', (data) => {
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
      socket.on('cursor-move', (data) => {
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
  }

  return new Response('Socket.IO server is running', { status: 200 });
}

export async function POST(req: NextRequest) {
  // Handle Socket.IO upgrade requests
  return new Response('Method not allowed', { status: 405 });
}
