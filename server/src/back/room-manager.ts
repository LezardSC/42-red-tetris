import type { FastifyInstance } from "fastify"
import Room from "./room.ts";
import type { RoomStatus } from "./room.ts";
import GameManager from "./game-manager.ts";
import UserManager from "./user-manager.ts";


class RoomManager {
    server!: FastifyInstance;
    userManager!: UserManager;
    rooms: Array<[string, Room]> = [];
    gameEndHandler!: (gameId: string) => void;


    public constructor(server: FastifyInstance, gameManager: GameManager, userManager: UserManager) {
        this.server = server;
        this.userManager = userManager;
        this.gameEndHandler = (gameid: string) => this.end(gameid)
        gameManager.gameManagerEmitter.on('gameend', this.gameEndHandler);
    }

    public create(host: string, roomId: string): boolean {
        this.rooms.push([roomId, new Room(this.userManager, host, roomId)]);
        this.server.log.info(`Created room ${roomId} with host ${host}.`);
        this.server.socketIO.emit('rooms', this.getAllRoomStatus())
        return true;
    }

    public delete(roomId: string): boolean {
        const index = this.rooms.findIndex(([id]) => id === roomId);

        if (index !== -1) {
            this.rooms.splice(index, 1);
            this.server.log.info(`Deleted room ${roomId}}.`);
            this.server.socketIO.emit('rooms', this.getAllRoomStatus())
            return true;
        } 
        else {
            this.server.log.info(`Failed to delete room ${roomId} because it wasn't found.`);
            return false;
        }
    }

    public join(playerId: string, roomId: string): boolean {
        try {
            const roomTuple = this.rooms.find(([id]) => id === roomId);
            
            if (!roomTuple) {
                throw new Error('Room was not found.');
            }
            
            roomTuple[1].addPlayer(playerId);
            this.server.log.info(`${playerId} joined room ${roomId}.`);
            this.server.socketIO.emit('rooms', this.getAllRoomStatus())
            return true;
        }
        catch (error){
            this.server.log.info(`Player ${playerId} failed to join room ${roomId} because ${error}.`);
            return false;
        }
    }

    public leave(playerId: string, roomId: string): boolean {
        try {
            const roomTuple = this.rooms.find(([id]) => id === roomId);
            
            if (!roomTuple) {
                throw new Error('Room was not found.');
            }
            
            roomTuple[1].removePlayer(playerId);
            this.server.log.info(`${playerId} left room ${roomId}.`);
            if (roomTuple[1].players.length === 0) {
                this.delete(roomId);
            } else {
                this.server.socketIO.emit('rooms', this.getAllRoomStatus())
            }

            return true;
        }
        catch (error){
            this.server.log.info(`Player ${playerId} failed to leave room ${roomId} because ${error}.`);
            return false;
        }
    }

    public start(playerId: string, roomId: string) {
        try {
            const roomTuple = this.rooms.find(([id]) => id === roomId);
            
            if (!roomTuple) {
                throw new Error('Room was not found.');
            }
            
            roomTuple[1].start(playerId);
            this.server.log.info(`${playerId} started game in room ${roomId}.`);
            return true;
        }
        catch (error){
            this.server.log.info(`Player ${playerId} failed to start game in room ${roomId} because ${error}.`);
            return false;
        }
    }

    public end(roomId: string) {
        try {
            const roomTuple = this.rooms.find(([id]) => id === roomId);
                
            if (!roomTuple) {
                throw new Error('Room was not found.');
            }

            roomTuple[1].end()
            this.server.socketIO.emit('rooms', this.getAllRoomStatus())

        }
        catch (error) {
            this.server.log.info(`Failed to end game in room ${roomId} because ${error}.`);
        }
    }

    public remove(playerId: string): string | null {
        for (const [, room] of this.rooms) {
            if (room.players.findIndex(id => id === playerId) > -1) {
                room.removePlayer(playerId);

                if (room.players.length === 0) {
                    this.delete(room.id);
                    return null;
                } else {
                    this.server.socketIO.emit('rooms', this.getAllRoomStatus())
                    return room.id;
                }
            }
        }
        return null;
    }

    public roomExists(roomId: string): boolean {
        const index = this.rooms.findIndex(([id]) => id === roomId);

        if (index !== -1) {
            return true;
        }

        return false
    }

    public checkAvailable(playerId: string): boolean {
        const result = this.rooms.every(([, room]) => room.players.indexOf(playerId) === -1);
        if (!result) {
            this.server.log.info(`Player ${playerId} is not available.`);
        }
        return result;
    }

    public getAllRoomStatus(): Array<RoomStatus> {
        let result: Array<RoomStatus> = []

        this.rooms.forEach(roomTuple => {
            result.push(roomTuple[1].getStatus())
        })

        return result;
    }

    public getRoomStatus(roomId: string): RoomStatus {
        const roomTuple = this.rooms.find(([id]) => id === roomId);

        if (!roomTuple) {
            this.server.log.info(`Room ${roomId} was not found`);

            return {
                id: '',
                host: '',
                players: [],
                maxPlayers: -1,
                gameOngoing: false
            }
        }
        return roomTuple[1].getStatus();
    }

    public isNameTaken(roomId: string, name: string): boolean {
        const roomTuple = this.rooms.find(([id]) => id === roomId);
        return roomTuple ? roomTuple[1].hasPlayerNamed(name) : false;
    }

    public getRoomPlayers(roomId: string): Array<string> | null {
        const roomTuple = this.rooms.find(([id]) => id === roomId);

        if (!roomTuple) {
            this.server.log.info(`Room ${roomId} was not found`);
            return null;
        }

        return roomTuple[1].players;
    }

    public getPlayerRoom(playerId: string): string | null {
        let result: string | null = null;
        this.rooms.forEach(room => {
            if (room[1].players.find(id => id === playerId)) {
                result = room[0];
            }
        });
        return result
    }
}

export default RoomManager