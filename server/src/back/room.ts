import UserManager from "./user-manager.ts";


class Room {
    id!: string;
    host!: string | undefined;
    players: Array<string> = [];
    maxPlayers: number = 4;
    gameOngoing: boolean = false;
    userManager!: UserManager;

    public constructor(userManager: UserManager, host: string, roomId: string) {
        this.id = roomId;
        this.host = host;
        this.players.push(host);
        this.userManager = userManager;
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
            throw new Error(`Failed to remove player ${playerId} from room ${this.id} because it wasn't found.`)
        }

        if (playerId === this.host) {
            if (this.players.length > 0) {
                this.host = this.players[0];
            }
        }
    }

    public start(playerId: string) {
        if (!(playerId === this.host)) {
            throw new Error(`Failed to start game in room ${this.id} because player ${playerId} is not the host. Host is ${this.host}.`)
        }
        if (this.gameOngoing) {
            throw new Error(`Failed to start game in room ${this.id} because the game is ongoing`)
        }
        this.gameOngoing = true;
    }

    public end() {
        this.gameOngoing = false;
    }

    public getStatus(): RoomStatus {
        let players: Array<string | undefined> = []
        this.players.forEach(
            player => players.push(this.userManager.getUserName(player))
        )

        return {
            id: this.id,
            host: this.userManager.getUserName(this.host),
            players: players,
            maxPlayers: this.maxPlayers,
            gameOngoing: this.gameOngoing
        }
    }

}

type RoomStatus = {
    id: string,
    host: string | undefined,
    players: Array<string | undefined>,
    maxPlayers: number,
    gameOngoing: boolean
}

export default Room
export type { RoomStatus }