import Fastify, { type FastifyInstance } from 'fastify'
import path from 'node:path'
import { fileURLToPath } from 'url';
import socketIO from './socketIO.ts';
import RoomManager from '../back/room.ts';
import GameManager from '../back/game.ts';
import HandlerFactory from './handlerfactory.ts';

const server: FastifyInstance = Fastify({logger: true});
const gameManager: GameManager = new GameManager(server);
const roomManager: RoomManager = new RoomManager(server);
const handlerFactory: HandlerFactory = new HandlerFactory(server, roomManager, gameManager);

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
    socket.on('disconnect', handlerFactory.createDisconnectHandler(socket));
    socket.on('join', handlerFactory.createJoinHandler(socket));
    socket.on('leave', handlerFactory.createLeaveHandler(socket));
    socket.on('start', handlerFactory.createStartHandler(socket));
    
    server.log.info(`Socket ${socket.id} connected.`);
    socket.emit('handshake')
  });
});

start('localhost', 3000);

export {server, gameManager, roomManager};