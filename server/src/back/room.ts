import type { FastifyInstance } from "fastify"

class RoomManager {
    server!: FastifyInstance;
    rooms: Array<[string, Room]> = [];

    public constructor(server: FastifyInstance) {
        this.server = server;
    }

    public create(host: string, roomId: string): boolean {
        this.rooms.push([roomId, new Room(host, roomId)]);
        this.server.log.info(`Created room ${roomId} with host ${host}.`);
        return true;
    }

    public delete(roomId: string): boolean {
        const index = this.rooms.findIndex(([id]) => id === roomId);

        if (index !== -1) {
            this.rooms.splice(index, 1);
            this.server.log.info(`Deleted room ${roomId}}.`);
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
            this.server.log.info(`Player ${playerId} failed to join room ${roomId} because ${error}.`);
            return false;
        }
    }

    public remove(playerId: string): string | null {
        for (const [, room] of this.rooms) {
            if (room.players.findIndex(id => id === playerId) > -1) {
                room.removePlayer(playerId);

                if (room.players.length === 0) {
                    this.delete(room.name);
                    return null;
                } else {
                    return room.name;
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

    public getRoomStatus(roomId: string): RoomStatus {
        const roomTuple = this.rooms.find(([id]) => id === roomId);

        if (!roomTuple) {
            this.server.log.info(`Room ${roomId} was not found`);

            return {
                name: '',
                host: '',
                players: [],
                maxPlayers: -1
            }
        }
        return roomTuple[1].getStatus();
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

class Room {
    name!: string;
    host!: string | undefined;
    players: Array<string> = [];
    maxPlayers: number = 4;

    public constructor(host: string, roomId: string) {
        this.name = roomId;
        this.host = host;
        this.players.push(host);
    }

    public addPlayer(playerId: string) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(playerId);
        }
        else {
            throw new Error('Room is full.');
        }
    }

    public removePlayer(playerId: string) {
        const index = this.players.findIndex(id => id === playerId);

        if (index !== -1) {
            this.players.splice(index, 1);
        }
        else {
            throw new Error(`Failed to remove player ${playerId} from room ${this.name} because it wasn't found.`)
        }

        if (playerId === this.host) {
            if (this.players.length > 0) {
                this.host = this.players[0];
            }
        }
    }

    public start(playerId: string) {
        if (!(playerId === this.host)) {
            throw new Error(`Failed to start game in room ${this.name} because player ${playerId} is not the host. Host is ${this.host}.`)
        }
    }

    public getStatus(): RoomStatus {
        return {
            name: this.name,
            host: this.host,
            players: this.players,
            maxPlayers: this.maxPlayers
        }
    }

}

type RoomStatus = {
    name: string,
    host: string | undefined,
    players: Array<string>,
    maxPlayers: number
}


export default RoomManager