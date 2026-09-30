import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "events";
import GameManager from "../src/back/game-manager.ts";
import UserManager from "../src/back/user-manager.ts";

const userManager = new UserManager();

const gameInstances: MockGame[] = [];

class MockGame {
    public gameId: string;
    public playersId: string[];
    public gameEmitter = new EventEmitter();

    public start = vi.fn();
    public keyPressed = vi.fn();
    public keyReleased = vi.fn();

    constructor(gameId: string, playersId: string[]) {
        this.gameId = gameId;
        this.playersId = playersId;

        gameInstances.push(this);
    }
}

vi.mock("../back/game.ts", () => ({
    default: vi.fn(MockGame),
}));

describe("GameManager", () => {
    let server: any;
    let manager: GameManager;

    beforeEach(() => {
        vi.clearAllMocks();
        gameInstances.length = 0;

        server = {
            log: {
                info: vi.fn(),
            },
            socketIO: {
                to: vi.fn().mockReturnValue({
                    emit: vi.fn(),
                }),
            },
        };

        manager = new GameManager(server);
    });

    describe("constructor", () => {
        it("should initialize with the provided server", () => {
            expect(manager.server).toBe(server);
            expect(manager.games).toEqual([]);
        });
    });

    describe("startGame", () => {
        it("should create and start a game", () => {
            manager.startGame(userManager, "game-1", ["player-1", "player-2"]);

            expect(gameInstances).toHaveLength(1);

            const game = gameInstances[0];
            if (game == null)
                return;

            expect(game.gameId).toBe("game-1");
            expect(game.playersId).toEqual([
                "player-1",
                "player-2",
            ]);

            expect(game.start).toHaveBeenCalledOnce();

            expect(manager.games).toHaveLength(1);
            expect(manager.games[0]?.[0]).toBe("game-1");
            expect(manager.games[0]?.[1]).toBe(game);
        });
    });

    describe("checkGameOngoing", () => {
        it("should return false when the game does not exist", () => {
            expect(
                manager.checkGameOngoing("unknown-game")
            ).toBe(false);

            expect(server.log.info).not.toHaveBeenCalled();
        });

        it("should return true when the game exists", () => {
            manager.startGame(userManager, "game-1", ["player-1"]);

            expect(
                manager.checkGameOngoing("game-1")
            ).toBe(true);

            expect(server.log.info).toHaveBeenCalledWith(
                "Game with id game-1 is already ongoing."
            );
        });
    });

    describe("keyPressed", () => {
        it("should forward the key press to every game", () => {
            manager.startGame(userManager, "game-1", ["player-1"]);
            manager.startGame(userManager, "game-2", ["player-2"]);

            manager.keyPressed("player-1", "ArrowLeft");

            expect(gameInstances[0]?.keyPressed)
                .toHaveBeenCalledWith(
                    "player-1",
                    "ArrowLeft"
                );

            expect(gameInstances[1]?.keyPressed)
                .toHaveBeenCalledWith(
                    "player-1",
                    "ArrowLeft"
                );
        });
    });

    describe("keyReleased", () => {
        it("should forward the key release to every game", () => {
            manager.startGame(userManager, "game-1", ["player-1"]);
            manager.startGame(userManager, "game-2", ["player-2"]);

            manager.keyReleased("player-1", "ArrowLeft");

            expect(gameInstances[0]?.keyReleased)
                .toHaveBeenCalledWith(
                    "player-1",
                    "ArrowLeft"
                );

            expect(gameInstances[1]?.keyReleased)
                .toHaveBeenCalledWith(
                    "player-1",
                    "ArrowLeft"
                );
        });
    });

    describe("game events", () => {
        it("should send game status to socket.io", () => {
            manager.startGame(userManager, "game-1", ["player-1"]);

            const game = gameInstances[0];
            if (game == null)
                return;

            const status = {
                time: 42,
                players: [],
            };

            game.gameEmitter.emit("status", status);

            expect(server.socketIO.to)
                .toHaveBeenCalledWith("game-1");

            expect(
                server.socketIO.to.mock.results[0].value.emit
            ).toHaveBeenCalledWith(
                "gamestatus",
                status
            );
        });

        it("should remove the game when it ends", () => {
            manager.startGame(userManager, "game-1", ["player-1"]);

            expect(manager.games).toHaveLength(1);

            const game = gameInstances[0];
            if (game == null)
                return;

            game.gameEmitter.emit("gameend");

            expect(manager.games).toHaveLength(0);

            expect(server.log.info).toHaveBeenCalledWith(
                "Game game-1 was deleted."
            );
        });

        it("should emit gameend through the manager", () => {
            const listener = vi.fn();

            manager.gameManagerEmitter.on(
                "gameend",
                listener
            );

            manager.startGame(userManager, "game-1", ["player-1"]);

            const game = gameInstances[0];
            if (game == null)
                return;

            game.gameEmitter.emit("gameend");

            expect(listener).toHaveBeenCalledWith("game-1");
        });
    });
});
