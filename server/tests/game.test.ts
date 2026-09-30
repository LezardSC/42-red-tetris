import {
    beforeEach,
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import Game from "../src/back/game.ts";
import UserManager from "../src/back/user-manager.ts";
const userManager = new UserManager();


describe("Game", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("constructor", () => {
        it("should create a game with the given id", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1", "player-2"],
            );

            expect(game.gameId).toBe("game-1");
        });

        it("should create one player for each player id", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1", "player-2"]
            );

            expect(game.players).toHaveLength(2);

            expect(game.players[0]?.[0]).toBe("player-1");
            expect(game.players[1]?.[0]).toBe("player-2");
        });

        it("should initialize the game time to zero", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1"]
            );

            expect(game.time).toBe(0);
            expect(game.gameEnded).toBe(false);
        });
    });

    describe("keyPressed", () => {
        it("should send the key to the correct player", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1", "player-2"]
            );

            const player = game.players[0]?.[1];

            const spy = vi.spyOn(
                player!,
                "keyPressed"
            );

            game.keyPressed(
                "player-1",
                "ArrowLeft"
            );

            expect(spy).toHaveBeenCalledWith(
                "ArrowLeft"
            );
        });

        it("should do nothing when the player does not exist", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1"]
            );

            const spy = vi.spyOn(
                game.players[0]![1],
                "keyPressed"
            );

            game.keyPressed(
                "unknown-player",
                "ArrowLeft"
            );

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe("keyReleased", () => {
        it("should send the key release to the correct player", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1", "player-2"]
            );

            const player = game.players[1]?.[1];

            const spy = vi.spyOn(
                player!,
                "keyReleased"
            );

            game.keyReleased(
                "player-2",
                "ArrowRight"
            );

            expect(spy).toHaveBeenCalledWith(
                "ArrowRight"
            );
        });

        it("should do nothing when the player does not exist", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1"]
            );

            const spy = vi.spyOn(
                game.players[0]![1],
                "keyReleased"
            );

            game.keyReleased(
                "unknown-player",
                "ArrowRight"
            );

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe("game loop", () => {
        it("should increment the game time", async () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1"]
            );

            game.start();

            expect(game.time).toBe(1);

            game.gameEnded = true;

            await vi.runOnlyPendingTimersAsync();
        });

        it("should call player game methods", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1"]
            );

            const player = game.players[0]![1];

            const moveSpy = vi.spyOn(
                player,
                "move"
            );

            const moveDownSpy = vi.spyOn(
                player,
                "moveDown"
            );

            const rowsSpy = vi.spyOn(
                player,
                "checkCompletedRows"
            );

            game.start();

            expect(moveSpy).toHaveBeenCalled();
            expect(moveDownSpy).toHaveBeenCalled();
            expect(rowsSpy).toHaveBeenCalled();

            game.gameEnded = true;
        });
    });

    describe("events", () => {
        it("should emit status", () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1"]
            );

            const listener = vi.fn();

            game.gameEmitter.on(
                "status",
                listener
            );

            game.start();

            expect(listener).toHaveBeenCalled();

            const status = listener.mock
                .calls[0]?.[0];

            expect(status.time).toBe(0);
            expect(status.players).toBe(
                game.players
            );

            game.gameEnded = true;
        });

        it("should emit gameend when the game ends", async () => {
            const game = new Game(
                userManager,
                "game-1",
                ["player-1"]
            );

            const listener = vi.fn();

            game.gameEmitter.on(
                "gameend",
                listener
            );

            game.players[0]![1].lost = true;

            game.start();

            await vi.runOnlyPendingTimersAsync();

            expect(listener).toHaveBeenCalled();

            game.gameEnded = true;
        });
    });

    describe("player events", () => {
        it("should add idle rows to other players", () => {
            const game = new Game(
                userManager,
                "game-1",
                [
                    "player-1",
                    "player-2",
                    "player-3",
                ]
            );

            const player1 = game.players[0]![1];
            const player2 = game.players[1]![1];
            const player3 = game.players[2]![1];

            const player1Spy = vi.spyOn(
                player1,
                "addIdleRows"
            );

            const player2Spy = vi.spyOn(
                player2,
                "addIdleRows"
            );

            const player3Spy = vi.spyOn(
                player3,
                "addIdleRows"
            );

            player1.playerEmitter.emit(
                "deletedrows",
                "player-1",
                4
            );

            expect(
                player1Spy
            ).not.toHaveBeenCalled();

            expect(
                player2Spy
            ).toHaveBeenCalledWith(3);

            expect(
                player3Spy
            ).toHaveBeenCalledWith(3);
        });
    });
});
