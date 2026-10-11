import { EventEmitter } from "events";
import Player from "./player.ts";
import { Piece, PieceManager } from "./piece.ts";
import UserManager from "./user-manager.ts";


class Game {
    gameId!: string;
    gameEnded: boolean = false;
    time: number = 0;
    players: Array<[string, Player]> = [];
    pieceManager!: PieceManager;
    gameEmitter: EventEmitter = new EventEmitter();

    public constructor(userManager: UserManager, gameId: string, playersId: Array<string>) {
        this.gameId = gameId;
        this.pieceManager = new PieceManager();
        playersId.forEach(id => {
            this.players.push([id, new Player(userManager.getUserName(id), id, [10, 20], this.pieceManager.nextPieces[0])])
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
        this.startEmissionLoop(50);
        this.startMainGameLoop(500);
        this.startMoveGameLoop(25);
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
            this.time++;
            const start = performance.now();
            this.players.filter(player => !player[1].lost).forEach(async player => {
                player[1].moveDown();
                player[1].checkCompletedRows();
            });
            const elapsed = performance.now() - start;
            const remaining = Math.max(0, timer - elapsed);
            await new Promise(resolve => setTimeout(resolve, remaining));
        }
    }

    private async startMoveGameLoop(timer: number) {
        while (!this.gameEnded) {
            const start = performance.now();
            for (const player of this.players) {
                await player[1].move();
            }
            const elapsed = performance.now() - start;
            const remaining = Math.max(0, timer - elapsed);
            await new Promise(resolve => setTimeout(resolve, remaining));
        }
    }

}

type GameStatus = {
    time: number,
    players: Array<[string, Player]>
}

export default Game
export type { GameStatus }