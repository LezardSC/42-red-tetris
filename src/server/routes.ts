import type { FastifyInstance } from "fastify";

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */

const pingSchema = {
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

async function set_routes (fastify: FastifyInstance, options: Object) {
  fastify.get('/ping', pingSchema, async (_request, _reply) => {
    return { pong: 'It worked!' }
  })

  fastify.get('/hello-world', async(_request, _reply) => {
    return _reply.sendFile('hello-world.html')
  })
}

//ESM
export default set_routes;