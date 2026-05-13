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

    public keyPressed(playerId: string, key: string) {
        for (let i: number = 0; i < this.games.length; i++) {
            const gameTuple = this.games[i];
            if (!gameTuple) {
                return;
            }

            gameTuple[1].keyPressed(playerId, key);
        }
    }

    public keyReleased(playerId: string, key: string) {
        for (let i: number = 0; i < this.games.length; i++) {
            const gameTuple = this.games[i];
            if (!gameTuple) {
                return;
            }

            gameTuple[1].keyReleased(playerId, key);
        }
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
        this.startMainGameLoop();
        this.startMoveGameLoop();
    }

    public keyPressed(playerId: string, key: string) {
        const playerTuple = this.players.find(([id, ]) => id == playerId);
        if (!playerTuple) {
            return;
        }
        playerTuple[1].keyPressed(key);
    }

    public keyReleased(playerId: string, key: string) {
        const playerTuple = this.players.find(([id, ]) => id == playerId);
        if (!playerTuple) {
            return;
        }
        playerTuple[1].keyReleased(key);
    }
    
    private async startEmissionLoop() {
        while (this.time < 50) {
            let status: GameStatus = {time: this.time, players: this.players};
            this.gameStatusEmitter.emit('status', status);
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        this.gameStatusEmitter.emit('gameend');
    }
    
    private async startMainGameLoop() {
        while (this.time < 50) {
            // start chrono then update then sleep rest of time
            this.time++;
            this.players.forEach(player => {
                player[1].moveDown();
            });
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    private async startMoveGameLoop() {
        while (this.time < 50) {
            this.players.forEach(player => {
                player[1].move();
            });
            await new Promise(resolve => setTimeout(resolve, 75));
        }
    }

}

type GameStatus = {
    time: number,
    players: Array<[string, Player]>
}

export default GameManager