import type { FastifyInstance, FastifyReply, FastifyRequest, RouteShorthandOptions } from "fastify";

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */

const pingSchema: RouteShorthandOptions = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          pong: { type: 'string' }
        }
      }
    }
  }
}

async function set_routes (fastify: FastifyInstance, _options: Object) {
  fastify.get('/ping', pingSchema, async (_request: FastifyRequest, _reply: FastifyReply) => {
    return { pong: 'It worked!' }
  })

  fastify.get('/hello-world', async(_request: FastifyRequest, reply: FastifyReply) => {
    return reply.sendFile('hello-world.html')
  })
}

export default set_routes;