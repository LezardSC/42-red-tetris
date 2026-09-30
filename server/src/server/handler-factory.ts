import type { Socket } from 'socket.io';
import type { FastifyInstance } from 'fastify';
import type RoomManager from '../back/room-manager.ts';
import type GameManager from '../back/game-manager.ts';
import type UserManager from '../back/user-manager.ts';


class HandlerFactory {
    regex: RegExp = /^[a-zA-Z0-9_-]+$/;
    maxNameLength: number = 16;
    server!: FastifyInstance;
    roomManager!: RoomManager;
    gameManager!: GameManager;
    userManager!: UserManager;

    public constructor(server: FastifyInstance, roomManager: RoomManager, gameManager: GameManager, userManager: UserManager) {
        this.server = server;
        this.gameManager = gameManager;
        this.roomManager = roomManager;
        this.userManager = userManager;
    }

    public registerGameEvents() {
        this.gameManager.gameManagerEmitter.on('playerlost', (gameId: string, playerId: string) => {
          this.server.socketIO.to(gameId).emit('playerlost', { name: this.userManager.getUserName(playerId) ?? null });
        });
        // RoomManager's own 'gameend' listener runs first, so the room is already unlocked here.
        this.gameManager.gameManagerEmitter.on('gameend', (gameId: string, winnerId: string | null) => {
          this.server.socketIO.to(gameId).emit('gameend', { winner: this.userManager.getUserName(winnerId ?? undefined) ?? null });
          if (this.roomManager.roomExists(gameId)) {
            this.server.socketIO.to(gameId).emit('roomstatus', this.roomManager.getRoomStatus(gameId));
          }
        });
    }
    
    public createDisconnectHandler(socket: Socket) {
        return (reason: string) => {
            this.server.log.info(`Socket ${socket.id} disconnected. Reason: ${reason}`);
            this.gameManager.removePlayer(socket.id);
            let roomId: string | null = this.roomManager.remove(socket.id);
            if (roomId) {
              this.server.socketIO.to(roomId).emit("roomstatus", this.roomManager.getRoomStatus(roomId))
            }
            this.userManager.removeUser(socket.id);
            this.server.log.info(`Removed user ${socket.id}.`);
        }
    }

    public createPlayerNameHandler(socket: Socket) {
        return (name: any, ack?: (error: string) => void) => {
          const reply = typeof ack === "function" ? ack : () => {};

          if (typeof name !== "string" || !this.regex.test(name) || name.length > this.maxNameLength) {
            this.server.log.info(`Invalid player name from ${socket.id}.`);
            reply(`Username must be 1 to ${this.maxNameLength} letters, numbers or underscores.`);
            return;
          }

          if (!this.roomManager.checkAvailable(socket.id)) {
            reply('Cannot change username while in a room.');
            return;
          }

          this.userManager.addUser(socket.id, name);
          this.server.log.info(`Socket ${socket.id} is now ${name}.`);
          reply('');
        }
    }
    
    public createJoinHandler(socket: Socket) {
      return (roomId: any, ack?: (error: string) => void) => {
        const reply = typeof ack === "function" ? ack : () => {};

        if (typeof roomId !== "string" || !this.regex.test(roomId)) {
          this.server.log.info("Invalid room name.");
          reply('Room name can only contain letters, numbers and underscores.');
          return;
        }

        const name = this.userManager.getUserName(socket.id);
        if (name === undefined) {
          this.server.log.info(`Socket ${socket.id} has no username and cannot join a room.`);
          reply('Please choose a username first.');
          return;
        }

        if (!this.roomManager.checkAvailable(socket.id)) {
          reply('You are already in a room.');
          return;
        }

        if (this.gameManager.checkGameOngoing(roomId)) {
          reply('A game is in progress in this room. Try again after it ends.');
          return;
        }

        if (this.roomManager.isNameTaken(roomId, name)) {
          this.server.log.info(`Username ${name} is already taken in room ${roomId}.`);
          reply('This username is already taken in this room.');
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
    
          reply('');
          this.server.socketIO.to(roomId).emit("roomstatus", this.roomManager.getRoomStatus(roomId));
        } else {
          reply('This room is full.');
        }
      };
    }
    
    public createLeaveHandler(socket: Socket) {
        return () => {
          let roomId: string | null = this.roomManager.getPlayerRoom(socket.id);

          if (typeof roomId !== "string" || !this.regex.test(roomId)) {
            this.server.log.info('Invalid room name.')
            return;
          }
    
          this.gameManager.removePlayer(socket.id);
          let left: boolean = this.roomManager.leave(socket.id, roomId);
          if (left) {
            this.server.socketIO.to(roomId).emit('roomstatus', this.roomManager.getRoomStatus(roomId));
            socket.leave(roomId);
          }
        }
    }
    
    public createStartHandler(socket: Socket) {
        return () => {
          let roomId: string | null = this.roomManager.getPlayerRoom(socket.id);

          if (typeof roomId !== "string" || !this.regex.test(roomId)) {
            this.server.log.info('Invalid room name.')
            return;
          }
    
          let start: boolean = this.roomManager.start(socket.id, roomId);
          if (start) {
            this.server.socketIO.to(roomId).emit('gamestarting');
            this.server.socketIO.to(roomId).emit('roomstatus', this.roomManager.getRoomStatus(roomId));
            let players: Array<string> | null = this.roomManager.getRoomPlayers(roomId);
            if (players) {
              this.gameManager.startGame(this.userManager, roomId, players);
            }
          }
        }
    }

    // MOCK: stand-ins for topping out / winning until the client can play. Remove before evaluation.
    public createMockLoseHandler(socket: Socket) {
      return () => {
        this.gameManager.removePlayer(socket.id);
      }
    }

    public createMockWinHandler(socket: Socket) {
      return () => {
        this.gameManager.forceWin(socket.id);
      }
    }

    public createKeyPressedHandler(socket: Socket) {
      return (key: any) => {
        this.gameManager.keyPressed(socket.id, key);
      }
    }

    public createKeyReleasedHandler(socket: Socket) {
      return (key: any) => {
        this.gameManager.keyReleased(socket.id, key);
      }
    }

}

export default HandlerFactory
