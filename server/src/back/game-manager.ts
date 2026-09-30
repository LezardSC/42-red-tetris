import { EventEmitter } from "events";
import type { FastifyInstance } from "fastify";
import Game from "./game.ts"
import type { GameStatus } from "./game.ts";
import UserManager from "./user-manager.ts";
import type { Piece } from "./piece.ts";


class GameManager {
    server!: FastifyInstance;
    games: Array<[string, Game]> = [];
    gameManagerEmitter: EventEmitter = new EventEmitter();
    statusHandler!: (status: GameStatus) => void;
    gameEndHandler!: () => void;
    playerLostHandler!: (playerId: string) => void;
    
    public constructor(server: FastifyInstance) {
        this.server = server;
    }
    
    public startGame(userManager: UserManager, gameId: string, playersId: Array<string>) {
        
        let game: Game = new Game(userManager, gameId, playersId);
        this.statusHandler = (status: GameStatus) => this.sendGameStatus(status);
        this.playerLostHandler = (playerId: string) => this.gameManagerEmitter.emit('playerlost', gameId, playerId)
        this.gameEndHandler = () => this.gameEnded(gameId);
        game.gameEmitter.on("status", this.statusHandler);
        game.gameEmitter.on('playerlost', this.playerLostHandler);
        game.gameEmitter.on("gameend", this.gameEndHandler);
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

    private gameEnded(gameId: string) {
        try {
            const index = this.games.findIndex(([id]) => id === gameId);
            const gameTuple = this.games.find(([id]) => id === gameId);
            if (!gameTuple || index === -1) {
                throw new Error(`Game was not found.`);
            }
            this.gameManagerEmitter.emit('gameend', gameId);
            gameTuple[1].gameEmitter.off('status', this.statusHandler);
            gameTuple[1].gameEmitter.off('gameend', this.gameEndHandler);
            this.games.splice(index, 1);
            this.server.log.info(`Game ${gameId} was deleted.`)
        }
        catch (error) {
            this.server.log.info(`Game ${gameId} could not be deleted because ${error}.`)
        }
    }

    // Each player gets their own board and piece, and only the spectrum of their opponents.
    private sendGameStatus(status: GameStatus) {
        status.players.forEach(([socketId, player]) => {
            const playerStatus: PlayerStatus = {
                time: status.time,
                board: player.board,
                piece: player.piece,
                lost: player.lost,
                opponents: status.players
                    .filter(([id]) => id !== socketId)
                    .map(([, opponent]) => ({
                        name: opponent.playerName ?? '',
                        spectrum: opponent.getSpectrum(),
                        alive: !opponent.lost,
                    })),
            };
            this.server.socketIO.to(socketId).emit('gamestatus', playerStatus);
        });
    }

}

type PlayerStatus = {
    time: number,
    board: Array<Array<number>>,
    piece: Piece,
    lost: boolean,
    opponents: Array<{ name: string, spectrum: Array<number>, alive: boolean }>,
}

export default GameManager
export type { PlayerStatus }