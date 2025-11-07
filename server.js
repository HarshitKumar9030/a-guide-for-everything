/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app with better Windows compatibility
const app = next({ 
  dev, 
  hostname, 
  port,
  quiet: false,
  conf: {
    // Disable telemetry to avoid permission issues
    telemetry: false
  }
});
const handle = app.getRequestHandler();

// Storage for collaborative sessions
const guideConnections = new Map();
const userSessions = new Map();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    const { guideId, userId, userName, userImage } = socket.handshake.query;
    
    if (!guideId || !userId) {
      console.log('❌ Missing guideId or userId, disconnecting:', socket.id);
      socket.disconnect();
      return;
    }

    console.log('👤 User joined guide:', { userId, userName, guideId });

    // Store user session
    userSessions.set(socket.id, {
      id: userId,
      name: userName,
      email: userId,
      image: userImage,
      guideId: guideId
    });

    // Add to guide connections
    if (!guideConnections.has(guideId)) {
      guideConnections.set(guideId, new Set());
    }
    guideConnections.get(guideId).add(socket.id);

    // Join guide room
    socket.join(guideId);

    // Notify other users in the guide
    socket.to(guideId).emit('user-joined', {
      id: userId,
      name: userName,
      email: userId,
      image: userImage
    });

    // Send current users to the new user
    const currentUsers = Array.from(guideConnections.get(guideId) || [])
      .map(socketId => userSessions.get(socketId))
      .filter(Boolean)
      .filter(user => user?.id !== userId);

    currentUsers.forEach(user => {
      socket.emit('user-joined', user);
    });

    console.log(`📊 Guide ${guideId} now has ${guideConnections.get(guideId).size} users`);

    // Handle content changes
    socket.on('content-change', (data) => {
      const { content, version, guideId: targetGuideId } = data;
      
      if (targetGuideId === guideId) {
        console.log('📝 Content changed in guide:', guideId, 'by user:', userId);
        socket.to(guideId).emit('content-changed', {
          content,
          version,
          userId: userId
        });
      }
    });

    // Handle cursor movements
    socket.on('cursor-move', (data) => {
      const { cursor, selection, guideId: targetGuideId } = data;
      
      if (targetGuideId === guideId) {
        socket.to(guideId).emit('cursor-moved', {
          userId: userId,
          cursor,
          selection
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
      
      const userSession = userSessions.get(socket.id);
      if (userSession) {
        console.log('👤 User left guide:', { userId: userSession.id, guideId: userSession.guideId });
        
        // Remove from guide connections
        guideConnections.get(userSession.guideId)?.delete(socket.id);
        
        // Clean up empty guide rooms
        if (guideConnections.get(userSession.guideId)?.size === 0) {
          guideConnections.delete(userSession.guideId);
          console.log('🧹 Cleaned up empty guide room:', userSession.guideId);
        }

        // Notify other users
        socket.to(userSession.guideId).emit('user-left', userSession.id);
        
        // Remove user session
        userSessions.delete(socket.id);

        console.log(`📊 Guide ${userSession.guideId} now has ${guideConnections.get(userSession.guideId)?.size || 0} users`);
      }
    });
  });

  // Start the server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Ready on http://${hostname}:${port}`);
    console.log('🔌 Socket.IO server is running');
  });
});
