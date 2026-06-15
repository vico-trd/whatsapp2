const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000

const app = express();
const server = createServer(app);

// En producción cliente y servidor están en el mismo dominio → no hay problema de CORS
// En local el cliente corre en :5173, por eso permitimos ese origen
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' },
  maxHttpBufferSize: 10e6
});

// Servir los archivos estáticos del cliente Vue (carpeta dist generada por "npm run build")
app.use(express.static(path.join(__dirname, '../client/dist')));
// Cualquier ruta desconocida devuelve el index.html de Vue (necesario para el router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
});

// Usuarios conectados: { socketId: { id, nombre, estado, avatar } }
const usuarios = {};

io.on('connection', (socket) => {

  // ── Login: el usuario manda sus datos ─────────────────────────
  socket.on('login', (datos) => {
    usuarios[socket.id] = { id: socket.id, nombre: datos.nombre, estado: datos.estado, avatar: datos.avatar };
    io.emit('lista usuarios', Object.values(usuarios));
    console.log(`${datos.nombre} conectado`);
  });

  // ── Salas ─────────────────────────────────────────────────────
  socket.on('join room', (sala) => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    socket.join(sala);
    io.to(sala).emit('aviso', { texto: `${usuario.nombre} se ha unido a ${sala}`, sala });
  });

  socket.on('leave room', (sala) => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    socket.leave(sala);
    io.to(sala).emit('aviso', { texto: `${usuario.nombre} ha salido de ${sala}`, sala });
  });

  // ── Mensaje en una sala ────────────────────────────────────────
  socket.on('chat message', ({ texto, sala }) => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    io.to(sala).emit('chat message', { texto, sala, nombre: usuario.nombre, avatar: usuario.avatar, de: socket.id });
  });

  // ── Mensaje privado ────────────────────────────────────────────
  socket.on('private message', ({ texto, para }) => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    const msg = { texto, nombre: usuario.nombre, avatar: usuario.avatar, de: socket.id, para };
    socket.to(para).emit('private message', msg);  // al destinatario
    socket.emit('private message', msg);            // de vuelta al remitente
  });

  // ── Archivo en una sala ────────────────────────────────────────
  socket.on('file message', ({ archivo, nombreArchivo, mimeType, sala }) => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    io.to(sala).emit('file message', { archivo, nombreArchivo, mimeType, sala, nombre: usuario.nombre, avatar: usuario.avatar, de: socket.id });
  });

  // ── Archivo privado ────────────────────────────────────────────
  socket.on('private file', ({ archivo, nombreArchivo, mimeType, para }) => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    const msg = { archivo, nombreArchivo, mimeType, nombre: usuario.nombre, avatar: usuario.avatar, de: socket.id, para };
    socket.to(para).emit('private file', msg);
    socket.emit('private file', msg);
  });

  // ── Indicador de escritura en sala ────────────────────────────
  socket.on('typing', ({ escribiendo, sala }) => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    socket.to(sala).emit('typing', { nombre: usuario.nombre, escribiendo, sala });
  });

  // ── Indicador de escritura privado ────────────────────────────
  socket.on('typing private', ({ escribiendo, para }) => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    socket.to(para).emit('typing private', { nombre: usuario.nombre, escribiendo, de: socket.id });
  });

  // ── Desconexión ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    const usuario = usuarios[socket.id];
    if (!usuario) return;
    // Avisamos en cada sala donde estaba el usuario
    [...socket.rooms]
      .filter(r => r !== socket.id)
      .forEach(sala => io.to(sala).emit('aviso', { texto: `${usuario.nombre} ha salido del chat`, sala }));
    delete usuarios[socket.id];
    io.emit('lista usuarios', Object.values(usuarios));
    console.log(`${usuario.nombre} desconectado`);
  });
});

server.listen(PORT, () => {
  console.log(`servidor corriendo en http://localhost:${PORT}`);
});

