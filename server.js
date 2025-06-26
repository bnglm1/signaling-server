const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log(`📡 Bağlanan: ${socket.id}`);

  if (waitingUser) {
    socket.emit('match_found', { peerId: waitingUser });
    io.to(waitingUser).emit('match_found', { peerId: socket.id });
    waitingUser = null;
  } else {
    waitingUser = socket.id;
  }

  socket.on('offer', (data) => {
    io.to(data.to).emit('offer', {
      from: socket.id,
      sdp: data.sdp,
    });
  });

  socket.on('answer', (data) => {
    io.to(data.to).emit('answer', {
      from: socket.id,
      sdp: data.sdp,
    });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Ayrıldı: ${socket.id}`);
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 Signaling sunucusu çalışıyor: http://localhost:3000');
});
