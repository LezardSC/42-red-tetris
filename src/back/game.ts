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
        this.startEmissionLoop(10);
        this.startMainGameLoop(150);
        this.startMoveGameLoop(100);
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
    
    private async startEmissionLoop(timer: number) {
        while (true) {
            let status: GameStatus = {time: this.time, players: this.players};
            this.gameStatusEmitter.emit('status', status);
            await new Promise(resolve => setTimeout(resolve, timer));
        }
        this.gameStatusEmitter.emit('gameend');
    }
    
    private async startMainGameLoop(timer: number) {
        while (true) {
            //TODO: start chrono then update then sleep rest of time
            this.time++;
            this.players.forEach(player => {
                player[1].moveDown();
                player[1].checkCompletedRows();
            });
            await new Promise(resolve => setTimeout(resolve, timer));
        }
    }

    //TODO: Pourrait etre chez le player pour prendre en compte le keydown
    private async startMoveGameLoop(timer: number) {
        while (true) {
            this.players.forEach(player => {
                player[1].move();
            });
            await new Promise(resolve => setTimeout(resolve, timer));
        }
    }

}

type GameStatus = {
    time: number,
    players: Array<[string, Player]>
}

export default GameManager