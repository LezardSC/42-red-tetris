import { EventEmitter } from "events";
import type { FastifyInstance } from "fastify";
import Player from "./player.ts";

class GameManager {
    server!: FastifyInstance;
    games: Array<[string, Game]> = [];

    public constructor(server: FastifyInstance) {
        this.server = server;
    }

    public startGame(gameId: string, playersId: Array<string>) {
        let game: Game = new Game(gameId, playersId);
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
    players: Array<[string, Player]> = []

    public constructor(gameId: string, playersId: Array<string>) {
        this.gameId = gameId;
        playersId.forEach(id => {
            this.players.push([id, new Player(id, [10, 20])])
        });
    }

    public start() {
        this.startEmissionLoop();
        this.startGameLoop();
    }
    
    private async startEmissionLoop() {
        while (this.time < 50) {
            let status: GameStatus = {time: this.time, players: this.players};
            this.gameStatusEmitter.emit('status', status);
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        this.gameStatusEmitter.emit('gameend');
    }
    
    private async startGameLoop() {
        while (this.time < 50) {
            // start chrono then update then sleep rest of time
            this.time++;
            this.updateGame();
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    private updateGame() {
        this.players.forEach(player => {
            player[1].move();
        });
    }
}

type GameStatus = {
    time: number,
    players: Array<[string, Player]>
}

export default GameManager