import { EventEmitter } from "events";
import type { FastifyInstance } from "fastify";

class GameManager {
    server!: FastifyInstance;
    games: Array<[string, Game]> = [];

    public constructor(server: FastifyInstance) {
        this.server = server;
    }

    public startGame(gameId: string) {
        let game: Game = new Game(gameId);
        game.gameStatusEmitter.on('status', (status) => this.sendGameStatus(gameId, status));
        game.gameStatusEmitter.on('gameend', () => this.gameEnded(gameId));
        this.games.push([gameId, game]);
        game.start();
    }

    public checkGameOngoing(gameId: string): boolean {
        const result: boolean = !this.games.every(([id]) => id !== gameId)

        if (result) {
            this.server.log.info(`Game with id ${gameId} is already ongoing.`)
        }

        return result
    }

    private gameEnded(gameId: string) {
        try {
            const index = this.games.findIndex(([id]) => id === gameId);
            const gameTuple = this.games.find(([id]) => id === gameId);
            if (!gameTuple || index === -1) {
                throw new Error(`Game was not found.`);
            }
            gameTuple[1].gameStatusEmitter.off('status', (status) => this.sendGameStatus(gameId, status));
            gameTuple[1].gameStatusEmitter.off('gameend', () => this.gameEnded(gameId));
            this.games.splice(index, 1);
            this.server.log.info(`Game ${gameId} was deleted.`)
        }
        catch (error) {
            this.server.log.info(`Game ${gameId} could not be deleted because ${error}.`)
        }
    }

    private sendGameStatus(gameId: string, status: GameStatus) {
        this.server.socketIO.to(gameId).emit('gamestatus', status)
    }

}

class Game {
    gameId!: string;
    gameStatusEmitter: EventEmitter = new EventEmitter();
    time: number = 0;

    public constructor(gameId: string) {
        this.gameId = gameId;
    }

    public async start() {
        while (this.time < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.time++;
            let status: GameStatus = {time: this.time};
            this.gameStatusEmitter.emit('status', status);
        }
        this.gameStatusEmitter.emit('gameend');

    }
}

type GameStatus = {
    time: number,
}

export default GameManager