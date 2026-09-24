import fastifyPlugin from "fastify-plugin";
import { Server, type ServerOptions } from "socket.io";

// Extend Fastify's TypeScript types
declare module "fastify" {
  interface FastifyInstance {
    socketIO: Server;
  }
}

// Define plugin options
export type SocketIOOptions = Partial<ServerOptions> & {
  preClose?: (done: () => void) => void;
};

// Define plugin
const socketIO = fastifyPlugin<SocketIOOptions>(
  async function (fastify, options) {
    // Create Socket.IO instance attached to Fastify's native HTTP server
    const socketIO = new Server(fastify.server, options);

    // Decorate Fastify instance so you can use fastify.socketIO
    fastify.decorate("socketIO", socketIO);

    // Handle server pre-close (disconnect clients before shutdown)
    fastify.addHook("preClose", (done) => {
      if (options.preClose) {
        return options.preClose(done);
      }
      fastify.socketIO.local.disconnectSockets(true);
      done();
    });

    // Handle full close (close Socket.IO server)
    fastify.addHook("onClose", (instance, done) => {
      instance.socketIO.close();
      done();
    });
  },
  { name: "socket-io" }
);

export default socketIO;