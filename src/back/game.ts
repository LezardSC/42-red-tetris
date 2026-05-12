import { EventEmitter } from "events";
import type { FastifyInstance } from "fastify";

// const emitter = new EventEmitter();

// emitter.on("message", (data) => {
//   console.log(data);
// });

// emitter.emit("message", "Hi");

class GameManager {
    server!: FastifyInstance;
    games: Array<[string, Game]> = [];

    public constructor(server: FastifyInstance) {
        this.server = server;
    }

    public startGame(gameId: string) {
        let game: Game = new Game(gameId);
        game.gameStatusEmitter.on('status', (status) => this.sendGameStatus(gameId, status)); // Need to unsubscribe on game ending
        this.games.push([gameId, game]);
        game.start();
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
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.time++;
            let status: GameStatus = {time: this.time};
            this.gameStatusEmitter.emit('status', status);
        }
    }
}

type GameStatus = {
    time: number,
}

export default GameManager