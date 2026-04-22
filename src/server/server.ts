import Fastify, { type FastifyInstance } from 'fastify'
import path from 'node:path'
import { fileURLToPath } from 'url';
import socketIO from './socketIO.ts';

const server: FastifyInstance = Fastify({logger: true});

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
  // we need to wait for the server to be ready, else `server.io` is undefined
  server.socketIO.on('connection', (socket) => {
    server.log.info(`Socket ${socket.id} connected.`);
    socket.on('howdy', (_arg) => {
      socket.emit('hello', 'world');
    })
  });
});

start('localhost', 3000);