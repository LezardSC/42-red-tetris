import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */


async function set_routes (fastify: FastifyInstance, _options: Object) {
  fastify.get('/test', async(_request: FastifyRequest, reply: FastifyReply) => {
    return reply.sendFile('test.html')
  })
  fastify.get('/', async(_request: FastifyRequest, reply: FastifyReply) => {
    return reply.sendFile('index.html')
  })
}

export default set_routes;