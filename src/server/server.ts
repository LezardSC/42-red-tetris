import Fastify, { type FastifyInstance } from 'fastify'
import path from 'node:path'
import { fileURLToPath } from 'url';
// import { Server, IncomingMessage, ServerResponse } from 'http'

const server: FastifyInstance = Fastify({logger: true})
const __filename: string = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname: string = path.dirname(__filename); // get the name of the directory

server.register(import('@fastify/static'), {
  root: path.join(__dirname, '../front'),
})

server.register(import('./routes.ts'))

const start = async (_host: string, _port: number) => {
  try {
    await server.listen({ port: _port, host: _host })
  } 
  catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start('localhost', 3000)