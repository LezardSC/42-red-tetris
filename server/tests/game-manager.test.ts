import { beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "../src/back/game-manager.ts";
import UserManager from "../src/back/user-manager.ts";
import type Player from "../src/back/player.ts";
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
        it("should send each player their own board and their opponents' spectrums", () => {
            manager.startGame(userManager, "game-1", ["player-1", "player-2"]);

            const gameTuple = manager.games[0];
            expect(gameTuple).toBeDefined();
            const game = gameTuple[1];
            const [player1, player2] = game.players.map(([, player]) => player) as [Player, Player];
            player1.playerName = "Alice";
            player2.playerName = "Bob";
            player2.addIdleRows(3);
            player2.lost = true;

            const emits: Record<string, ReturnType<typeof vi.fn>> = {};
            server.socketIO.to = vi.fn((id: string) => {
                emits[id] = vi.fn();
                return { emit: emits[id] };
            });

            game.gameEmitter.emit("status", { time: 42, players: game.players });

            expect(server.socketIO.to).toHaveBeenCalledWith("player-1");
            expect(server.socketIO.to).toHaveBeenCalledWith("player-2");
            expect(server.socketIO.to).not.toHaveBeenCalledWith("game-1");

            expect(emits["player-1"]).toHaveBeenCalledWith("gamestatus", {
                time: 42,
                board: player1.board,
                piece: player1.piece,
                lost: false,
                opponents: [{ name: "Bob", spectrum: Array(10).fill(3), alive: false }],
            });
            expect(emits["player-2"]).toHaveBeenCalledWith("gamestatus", {
                time: 42,
                board: player2.board,
                piece: player2.piece,
                lost: true,
                opponents: [{ name: "Alice", spectrum: Array(10).fill(0), alive: true }],
            });
        });

        it("should remove the game when it ends", () => {
            manager.startGame(userManager, "game-1", ["player-1"]);

            expect(manager.games).toHaveLength(1);

            const gameTuple = manager.games[0];
            expect(gameTuple).toBeDefined();
            const game = gameTuple[1];

            game.gameEmitter.emit("gameend", "player-1");

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

            game.gameEmitter.emit("gameend", "player-1");

            expect(listener).toHaveBeenCalledWith("game-1", "player-1");
        });
    });
    describe("keyPressed", () => {
        it("should forward the key press to every game", () => {
            manager.startGame(
                userManager,
                "game-1",
                ["player-1"],
            );

            manager.startGame(
                userManager,
                "game-2",
                ["player-2"],
            );

            const game1 = manager.games[0]?.[1];
            const game2 = manager.games[1]?.[1];

            expect(game1).toBeDefined();
            expect(game2).toBeDefined();

            const game1Spy = vi.spyOn(game1!, "keyPressed");
            const game2Spy = vi.spyOn(game2!, "keyPressed");

            manager.keyPressed("player-1", "ArrowLeft");

            expect(game1Spy).toHaveBeenCalledWith(
                "player-1",
                "ArrowLeft",
            );

            expect(game2Spy).toHaveBeenCalledWith(
                "player-1",
                "ArrowLeft",
            );
        });
    });

    describe("keyReleased", () => {
        it("should forward the key release to every game", () => {
            manager.startGame(
                userManager,
                "game-1",
                ["player-1"],
            );

            manager.startGame(
                userManager,
                "game-2",
                ["player-2"],
            );

            const game1 = manager.games[0]?.[1];
            const game2 = manager.games[1]?.[1];

            expect(game1).toBeDefined();
            expect(game2).toBeDefined();

            const game1Spy = vi.spyOn(game1!, "keyReleased");
            const game2Spy = vi.spyOn(game2!, "keyReleased");

            manager.keyReleased("player-1", "ArrowRight");

            expect(game1Spy).toHaveBeenCalledWith(
                "player-1",
                "ArrowRight",
            );

            expect(game2Spy).toHaveBeenCalledWith(
                "player-1",
                "ArrowRight",
            );
        });
    });

    describe("removePlayer", () => {
        it("should forfeit the player in every game", () => {
            manager.startGame(
                userManager,
                "game-1",
                ["player-1"],
            );

            manager.startGame(
                userManager,
                "game-2",
                ["player-1"],
            );

            const game1 = manager.games[0]?.[1];
            const game2 = manager.games[1]?.[1];

            expect(game1).toBeDefined();
            expect(game2).toBeDefined();

            const game1Spy = vi.spyOn(game1!, "forfeit");
            const game2Spy = vi.spyOn(game2!, "forfeit");

            manager.removePlayer("player-1");

            expect(game1Spy).toHaveBeenCalledWith("player-1");
            expect(game2Spy).toHaveBeenCalledWith("player-1");
        });
    });

    describe("forceWin", () => {
        it("should forfeit every opponent of the player", () => {
            manager.startGame(
                userManager,
                "game-1",
                [
                    "player-1",
                    "player-2",
                    "player-3",
                ],
            );

            const game = manager.games[0]?.[1];

            expect(game).toBeDefined();

            const forfeitSpy = vi.spyOn(game!, "forfeit");

            manager.forceWin("player-1");

            expect(forfeitSpy).toHaveBeenCalledWith("player-2");
            expect(forfeitSpy).toHaveBeenCalledWith("player-3");

            expect(forfeitSpy).not.toHaveBeenCalledWith("player-1");
        });

        it("should do nothing when the player is not in the game", () => {
            manager.startGame(
                userManager,
                "game-1",
                [
                    "player-1",
                    "player-2",
                ],
            );

            const game = manager.games[0]?.[1];

            expect(game).toBeDefined();

            const forfeitSpy = vi.spyOn(game!, "forfeit");

            manager.forceWin("player-3");

            expect(forfeitSpy).not.toHaveBeenCalled();
        });
    });

});
