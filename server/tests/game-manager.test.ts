import { beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "../src/back/game-manager.ts";
import UserManager from "../src/back/user-manager.ts";
import Fastify from "fastify";

const userManager = new UserManager();

describe("GameManager", () => {
    let server: any;
    let manager: GameManager;

    beforeEach(async () => {
        vi.clearAllMocks();

        server = Fastify();

        // Mock the parts of FastifyInstance used by GameManager.
        server.log = {
            info: vi.fn(),
        };

        server.socketIO = {
            to: vi.fn(() => ({
                emit: vi.fn(),
            })),
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

            expect(manager.games).toHaveLength(1);

            const gameTuple = manager.games[0];
            expect(gameTuple).toBeDefined();
            const game = gameTuple[1];

            expect(game.gameId).toBe("game-1");
            expect(game.players.map(tuple => tuple[0])).toEqual([
                "player-1",
                "player-2",
            ]);

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

    describe("game events", () => {
        it("should send game status to socket.io", () => {
            manager.startGame(userManager, "game-1", ["player-1"]);

            const gameTuple = manager.games[0];
            expect(gameTuple).toBeDefined();
            const game = gameTuple[1];

            const status = {
                time: 42,
                players: [],
            };

            game.gameEmitter.emit("status", status);

            expect(server.socketIO.to)
                .toHaveBeenCalledWith("game-1");

        });

        it("should remove the game when it ends", () => {
            manager.startGame(userManager, "game-1", ["player-1"]);

            expect(manager.games).toHaveLength(1);

            const gameTuple = manager.games[0];
            expect(gameTuple).toBeDefined();
            const game = gameTuple[1];

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

            const gameTuple = manager.games[0];
            expect(gameTuple).toBeDefined();
            const game = gameTuple[1];

            game.gameEmitter.emit("gameend");

            expect(listener).toHaveBeenCalledWith("game-1");
        });
    });
});
