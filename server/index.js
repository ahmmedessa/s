const express = require('express');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const sessions = {};

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'build')));

io.on('connection', (socket) => {
  console.log(`A user connected ${socket.id}`);

  socket.on('createSession', () => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    sessions[sessionId] = { host: socket.id };
    socket.emit('sessionCreated', sessionId);
    console.log(`Session created with ID: ${sessionId}`);
  });

  socket.on('joinSession', ({ sessionId, deviceInfo }) => {
    if (sessions[sessionId]) {
      socket.emit('joinSuccess', { id: socket.id, sessionId, deviceInfo });
      io.to(sessions[sessionId].host).emit('joinRequest', { id: socket.id, sessionId, deviceInfo });
    } else {
      socket.emit('joinError', 'Invalid session ID');
    }
  });

  socket.on('shareResponse', ({ sessionId, response, id }) => {
    io.to(id).emit('shareResponse', response);
  });

  socket.on('sendSignal', ({ sessionId, signal }) => {
    if (sessions[sessionId]) {
      io.to(sessions[sessionId].host).emit('receiveSignal', signal);
    }
  });

  socket.on('disconnect', () => {
    console.log(`A user disconnected ${socket.id}`);
    for (let sessionId in sessions) {
      if (sessions[sessionId].host === socket.id) {
        delete sessions[sessionId];
        console.log(`Session ${sessionId} deleted`);
      }
    }
  });
});
