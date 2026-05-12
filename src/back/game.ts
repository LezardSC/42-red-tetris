import { EventEmitter } from "events";

// const emitter = new EventEmitter();

// emitter.on("message", (data) => {
//   console.log(data);
// });

// emitter.emit("message", "Hi");

class GameManager {
    games: Array<Game> = []
}

class Game {
    gameStatusEmitter: EventEmitter = new EventEmitter()

}

export default GameManager