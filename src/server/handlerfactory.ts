import type { Socket } from 'socket.io';
import type { FastifyInstance } from 'fastify';
import type RoomManager from '../back/room.ts';
import type GameManager from '../back/game.ts';


class HandlerFactory {
    regex: RegExp = /^[a-zA-Z0-9_]+$/;
    server!: FastifyInstance;
    roomManager!: RoomManager;
    gameManager!: GameManager;

    public constructor(server: FastifyInstance, roomManager: RoomManager, gameManager: GameManager) {
        this.server = server;
        this.gameManager = gameManager;
        this.roomManager = roomManager;
    }
    
    public createDisconnectHandler(socket: Socket) {
        return (reason: string) => {
            this.server.log.info(`Socket ${socket.id} disconnected. Reason: ${reason}`);
            let roomId: string | null = this.roomManager.remove(socket.id);
            if (roomId) {
              this.server.socketIO.to(roomId).emit("roomstatus", this.roomManager.getRoomStatus(roomId))
            }
            // Need to update games ?
        }
    }
    
    public createJoinHandler(socket: Socket) {
      return (roomId: any) => {
        if (typeof roomId !== "string" || !this.regex.test(roomId)) {
          this.server.log.info("Invalid room name.");
          return;
        }
    
        if (!this.roomManager.checkAvailable(socket.id)) {
          return;
        }

        if (this.gameManager.checkGameOngoing(roomId)) {
          return;
        }
    
        let joined = false;
    
        if (this.roomManager.roomExists(roomId)) {
          joined = this.roomManager.join(socket.id, roomId);
        } else {
          joined = this.roomManager.create(socket.id, roomId);
        }
    
        if (joined) {
          socket.join(roomId);
    
          this.server.socketIO.to(roomId).emit("roomstatus", this.roomManager.getRoomStatus(roomId));
        }
      };
    }
    
    public createLeaveHandler(socket: Socket) {
        return (roomId: any) => {
            if (typeof roomId !== "string" || !this.regex.test(roomId)) {
            this.server.log.info('Invalid room name.')
            return;
          }
    
          let left: boolean = this.roomManager.leave(socket.id, roomId);
          if (left) {
            this.server.socketIO.to(roomId).emit('roomstatus', this.roomManager.getRoomStatus(roomId));
            socket.leave(roomId);
          }
        }
    }
    
    public createStartHandler(socket: Socket) {
        return (roomId: any) => {
            if (typeof roomId !== "string" || !this.regex.test(roomId)) {
            this.server.log.info('Invalid room name.')
            return;
          }
    
          let start: boolean = this.roomManager.start(socket.id, roomId);
          if (start) {
            this.server.socketIO.to(roomId).emit('gamestarting');
            this.gameManager.startGame(roomId);
          }
        }
    }

}

export default HandlerFactory
