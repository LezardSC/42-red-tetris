import Fastify, { type FastifyInstance } from 'fastify'
import fs from 'node:fs';
import path from 'node:path'
import { fileURLToPath } from 'url';
import socketIO from './socketIO.ts';
import RoomManager from '../back/room.ts';
import GameManager from '../back/game.ts';
import UserManager from '../back/user.ts';
import HandlerFactory from './handlerfactory.ts';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const repoRoot: string = path.join(__dirname, '../../..');

const envFile: string = path.join(repoRoot, '.env');
if (fs.existsSync(envFile))
  process.loadEnvFile(envFile);

const HOST: string = process.env['HOST'] ?? '0.0.0.0';
const PORT: number = Number(process.env['PORT'] ?? 3000);
const CLIENT_DIST: string = path.resolve(repoRoot, process.env['CLIENT_DIST'] ?? 'client/dist');

const server: FastifyInstance = Fastify({logger: true});
const gameManager: GameManager = new GameManager(server);
const roomManager: RoomManager = new RoomManager(server);
const userManager: UserManager = new UserManager();
const handlerFactory: HandlerFactory = new HandlerFactory(server, roomManager, gameManager, userManager);

if (!fs.existsSync(path.join(CLIENT_DIST, 'index.html')))
  server.log.warn(`No client build in ${CLIENT_DIST}: run \`npm run build\` in client/ (or at the repo root).`);

server.register(import('@fastify/static'), {
  root: CLIENT_DIST,
});

server.setNotFoundHandler((request, reply) => {
  const url: string = request.url.split('?')[0] ?? '';
  if (request.method !== 'GET' || url.startsWith('/socket.io') || path.extname(url) !== '')
    return reply.code(404).send({ error: 'Not Found' });
  return reply.sendFile('index.html');
});

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
    socket.on('playername', handlerFactory.createPlayerNameHandler(socket));
    socket.on('join', handlerFactory.createJoinHandler(socket));
    socket.on('leave', handlerFactory.createLeaveHandler(socket));
    socket.on('start', handlerFactory.createStartHandler(socket));
    socket.on('keydown', handlerFactory.createKeyPressedHandler(socket));
    socket.on('keyup', handlerFactory.createKeyReleasedHandler(socket));
    
    server.log.info(`Socket ${socket.id} connected.`);
    socket.emit('rooms', roomManager.getAllRoomStatus());
    socket.emit('handshake');
  });
});

start(HOST, PORT);

export {server, gameManager, roomManager, userManager};