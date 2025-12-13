const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
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

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? `http://${hostname}:${port}` : false,
      methods: ['GET', 'POST'],
    },
  });

  // Export socket instance for API routes
  if (typeof global.io === 'undefined') {
    global.io = io;
  }

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a session room
    socket.on('join-session', (sessionId) => {
      socket.join(`session-${sessionId}`);
      console.log(`Socket ${socket.id} joined session-${sessionId}`);
    });

    // Leave a session room
    socket.on('leave-session', (sessionId) => {
      socket.leave(`session-${sessionId}`);
      console.log(`Socket ${socket.id} left session-${sessionId}`);
    });

    // Handle playback updates (play/pause/seek)
    socket.on('playback-update', (data) => {
      const { sessionId, time, playing } = data;
      socket.to(`session-${sessionId}`).emit('playback-sync', {
        time,
        playing,
      });
    });

    // Broadcast point creation to other clients in the session
    socket.on('point-created', (data) => {
      const sessionId = data.sessionId || data.session?.id;
      if (sessionId) {
        socket.to(`session-${sessionId}`).emit('point-created', data);
      }
    });

    // Broadcast point update to other clients in the session
    socket.on('point-updated', (data) => {
      const sessionId = data.sessionId || data.session?.id;
      if (sessionId) {
        socket.to(`session-${sessionId}`).emit('point-updated', data);
      }
    });

    // Broadcast point deletion to other clients in the session
    socket.on('point-deleted', (data) => {
      const sessionId = data.sessionId;
      const pointId = typeof data === 'string' ? data : data.pointId;
      if (sessionId) {
        socket.to(`session-${sessionId}`).emit('point-deleted', pointId);
      }
    });

    // Broadcast note creation to other clients in the session
    socket.on('note-created', (data) => {
      const sessionId = data.sessionId || data.session?.id;
      if (sessionId) {
        socket.to(`session-${sessionId}`).emit('note-created', data);
      }
    });

    // Broadcast note update to other clients in the session
    socket.on('note-updated', (data) => {
      const sessionId = data.sessionId || data.session?.id;
      if (sessionId) {
        socket.to(`session-${sessionId}`).emit('note-updated', data);
      }
    });

    // Broadcast note deletion to other clients in the session
    socket.on('note-deleted', (data) => {
      const sessionId = data.sessionId;
      const noteId = typeof data === 'string' ? data : data.noteId;
      if (sessionId) {
        socket.to(`session-${sessionId}`).emit('note-deleted', noteId);
      }
    });

    // Broadcast point permission changes to other clients in the session
    socket.on('point-permission-changed', (data) => {
      const sessionId = data.sessionId;
      if (sessionId) {
        socket.to(`session-${sessionId}`).emit('point-permission-changed', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

