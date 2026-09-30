import { EventEmitter } from "events";
import type { FastifyInstance } from "fastify";
import Player from "./player.ts";
import { Piece, PieceManager } from "./piece.ts";

class GameManager {
    server!: FastifyInstance;
    games: Array<[string, Game]> = [];
    gameManagerEmitter: EventEmitter = new EventEmitter();

    public constructor(server: FastifyInstance) {
        this.server = server;
    }

    public startGame(gameId: string, playersId: Array<string>) {
        let game: Game = new Game(gameId, playersId);
        game.gameEmitter.on('status', (status) => this.sendGameStatus(gameId, status));
        game.gameEmitter.on('playerlost', (playerId) => this.gameManagerEmitter.emit('playerlost', gameId, playerId));
        game.gameEmitter.on('gameend', (winnerId) => this.gameEnded(gameId, winnerId));
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

    public removePlayer(playerId: string) {
        this.games.forEach(([, game]) => game.forfeit(playerId));
    }

    // MOCK: makes every opponent of playerId lose, until the game itself is playable.
    public forceWin(playerId: string) {
        this.games.forEach(([, game]) => {
            if (game.players.some(([id]) => id == playerId)) {
                game.players.filter(([id]) => id != playerId).forEach(([id]) => game.forfeit(id));
            }
        });
    }

    private gameEnded(gameId: string, winnerId: string | null) {
        try {
            const index = this.games.findIndex(([id]) => id === gameId);
            const gameTuple = this.games.find(([id]) => id === gameId);
            if (!gameTuple || index === -1) {
                throw new Error(`Game was not found.`);
            }
            gameTuple[1].gameEmitter.removeAllListeners();
            this.games.splice(index, 1);
            this.gameManagerEmitter.emit('gameend', gameId, winnerId);
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
    gameEnded: boolean = false;
    time: number = 0;
    players: Array<[string, Player]> = [];
    pieceManager!: PieceManager;
    gameEmitter: EventEmitter = new EventEmitter();

    public constructor(gameId: string, playersId: Array<string>) {
        this.gameId = gameId;
        this.pieceManager = new PieceManager();
        playersId.forEach(id => {
            this.players.push([id, new Player(id, [10, 20], this.pieceManager.nextPieces[0])])
        });

        this.players.forEach((player) => player[1].playerEmitter.on('piecedown', (id) => {
            if (player[1].lost)
                return;
            if (id === this.pieceManager.nextPieces.length - 1)
                this.pieceManager.generateNewSet();
            player[1].piece = new Piece(4, 1, this.pieceManager.nextPieces[id + 1], id + 1)
        }));

        this.players.forEach((player) => player[1].playerEmitter.on('lost', (id) => this.gameEmitter.emit('playerlost', id)));

        this.players.forEach((player) => player[1].playerEmitter.on('deletedrows', (id, nb) => {
            this.players.filter(playerTuple => playerTuple[1].playerId != id).forEach(playerTuple =>{
                playerTuple[1].addIdleRows(nb - 1);
            })
        }));
        
    }

    public start() {
        this.startEmissionLoop(10);
        this.startMainGameLoop(150);
        // this.startMoveGameLoop(100);
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

    public forfeit(playerId: string) {
        const playerTuple = this.players.find(([id, ]) => id == playerId);
        if (!playerTuple) {
            return;
        }
        playerTuple[1].lose();
    }

    private getWinner(): string | null {
        if (this.players.length == 1) {
            return null;
        }
        const alive = this.players.find(([, player]) => !player.lost);
        return alive ? alive[0] : null;
    }
    
    private async startEmissionLoop(timer: number) {
        while (!this.gameEnded) {
            if ((this.players.length > 1 && this.players.length - this.players.filter(p => p[1].lost).length <= 1) 
                || (this.players.length == 1 && this.players.every(p => p[1].lost)))
                this.gameEnded = true;
            let status: GameStatus = {time: this.time, players: this.players};
            this.gameEmitter.emit('status', status);
            await new Promise(resolve => setTimeout(resolve, timer));
        }
        this.gameEmitter.emit('gameend', this.getWinner());
    }
    
    private async startMainGameLoop(timer: number) {
        while (!this.gameEnded) {
            //TODO: start chrono then update then sleep rest of time
            this.time++;
            this.players.filter(player => !player[1].lost).forEach(player => {
                player[1].move();
                player[1].moveDown();
                player[1].checkCompletedRows();
            });
            await new Promise(resolve => setTimeout(resolve, timer));
        }
    }

    // private async startMoveGameLoop(timer: number) {
    //     while (!this.gameEnded) {
    //         this.players.forEach(player => {
    //             player[1].move();
    //         });
    //         await new Promise(resolve => setTimeout(resolve, timer));
    //     }
    // }

}

type GameStatus = {
    time: number,
    players: Array<[string, Player]>
}

export default GameManager