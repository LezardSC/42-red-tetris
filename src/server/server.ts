import Fastify, { type FastifyInstance } from 'fastify'
import path from 'node:path'
import { fileURLToPath } from 'url';
import socketIO from './socketIO.ts';
import RoomManager from '../back/room.ts';

const server: FastifyInstance = Fastify({logger: true});
const roomManager: RoomManager = new RoomManager(server);

const __filename: string = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname: string = path.dirname(__filename); // get the name of the directory
server.register(import('@fastify/static'), {
  root: path.join(__dirname, '../front'),
});

server.register(import('./routes.ts'));
server.register(socketIO);

const start = async (_host: string, _port: number) => {
  try {
    await server.listen({ port: _port, host: _host });
  } 
  catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

server.ready().then(() => {
  server.socketIO.on('connection', (socket) => {
    // What if no arg or wrong type ?
    const regex = /^[a-zA-Z0-9_]+$/

    socket.on('disconnect', (reason) => {
      server.log.info(`Socket ${socket.id} disconnected. Reason: ${reason}`);
    });
    
    socket.on('join', (roomId) => {
      if (typeof roomId !== "string" || !regex.test(roomId)) {
        server.log.info('Invalid room name.')
        return;
      }
      if (!roomManager.checkAvailable(socket.id)) {
        return;
      }
      let joined: boolean = false;
      if (roomManager.roomExists(roomId)) {
        joined = roomManager.join(socket.id, roomId);
      }
      else {
        joined = roomManager.create(socket.id, roomId);
      }
      if (joined) {
        socket.join(roomId);
        server.socketIO.to(roomId).emit('roomstatus', roomManager.getRoomStatus(roomId));
      }
    })

    socket.on('leave', (roomId) => {
      if (typeof roomId !== "string" || !regex.test(roomId)) {
        server.log.info('Invalid room name.')
        return;
      }

      let left: boolean = roomManager.leave(socket.id, roomId);
      if (left) {
        server.socketIO.to(roomId).emit('roomstatus', roomManager.getRoomStatus(roomId));
        socket.leave(roomId);
      }
    })

    socket.on('start', (roomId) => {
      if (typeof roomId !== "string" || !regex.test(roomId)) {
        server.log.info('Invalid room name.')
        return;
      }

      let started: boolean = roomManager.start(socket.id, roomId);
      if (started) {
        server.socketIO.to(roomId).emit('gamestarted');
      }
    })
    
    server.log.info(`Socket ${socket.id} connected.`);
    socket.emit('handshake', '')
  });
});

start('localhost', 3000);