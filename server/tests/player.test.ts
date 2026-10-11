import { describe, expect, it, vi } from "vitest";
import Player from "../src/back/player.ts";
import { PieceType, Color } from "../src/back/piece.ts";

describe("Player", () => {
    const boardSize: [number, number] = [10, 20];

    const createPlayer = (
        playerName: string | undefined = "Player",
        playerId: string = "player-1",
        firstPiece: string = PieceType.T,
    ) => {
        return new Player(
            playerName,
            playerId,
            boardSize,
            firstPiece,
        );
    };

    describe("constructor", () => {
        it("should initialize the player id", () => {
            const player = createPlayer(
                "Alice",
                "player-123",
            );

            expect(player.playerId).toBe("player-123");
        });

        it("should initialize the player name", () => {
            const player = createPlayer("Alice");

            expect(player.playerName).toBe("Alice");
        });

        it("should initialize the board size", () => {
            const player = createPlayer();

            expect(player.boardSize).toEqual([10, 20]);
        });

        it("should initialize a board with the correct size", () => {
            const player = createPlayer();

            expect(player.board).toHaveLength(200);
        });

        it("should initialize every board cell as empty", () => {
            const player = createPlayer();

            expect(
                player.board.every(
                    color => color === Color.Empty,
                ),
            ).toBe(true);
        });

        it("should create the first piece", () => {
            const player = createPlayer(
                "Alice",
                "player-1",
                PieceType.T,
            );

            expect(player.piece.type).toBe(PieceType.T);
            expect(player.piece.id).toBe(0);
        });

        it("should create the first piece at the expected position", () => {
            const player = createPlayer();

            expect(player.piece.center.x).toBe(4);
            expect(player.piece.center.y).toBe(1);

            expect(player.piece.startPos.x).toBe(4);
            expect(player.piece.startPos.y).toBe(1);
        });

        it("should initialize the player as not lost", () => {
            const player = createPlayer();

            expect(player.lost).toBe(false);
        });

        it("should initialize all key states as false", () => {
            const player = createPlayer();

            expect(player.leftKey).toBe(false);
            expect(player.rightKey).toBe(false);
            expect(player.upKey).toBe(false);
            expect(player.downKey).toBe(false);
        });
    });

    describe("lose", () => {
        it("should mark the player as lost", () => {
            const player = createPlayer();

            player.lose();

            expect(player.lost).toBe(true);
        });

        it("should emit the lost event with the player id", () => {
            const player = createPlayer(
                "Alice",
                "player-42",
            );

            const listener = vi.fn();

            player.playerEmitter.on("lost", listener);

            player.lose();

            expect(listener).toHaveBeenCalledOnce();
            expect(listener).toHaveBeenCalledWith("player-42");
        });

        it("should only emit lost once", () => {
            const player = createPlayer();

            const listener = vi.fn();

            player.playerEmitter.on("lost", listener);

            player.lose();
            player.lose();
            player.lose();

            expect(listener).toHaveBeenCalledOnce();
        });

        it("should remain lost after calling lose multiple times", () => {
            const player = createPlayer();

            player.lose();
            player.lose();

            expect(player.lost).toBe(true);
        });
    });

    describe("keyPressed", () => {
        it("should set downKey for ArrowDown", () => {
            const player = createPlayer();

            player.keyPressed("ArrowDown");

            expect(player.downKey).toBe(true);
        });

        it("should set upKey for ArrowUp", () => {
            const player = createPlayer();

            player.keyPressed("ArrowUp");

            expect(player.upKey).toBe(true);
        });

        it("should set leftKey for ArrowLeft", () => {
            const player = createPlayer();

            player.keyPressed("ArrowLeft");

            expect(player.leftKey).toBe(true);
        });

        it("should set rightKey for ArrowRight", () => {
            const player = createPlayer();

            player.keyPressed("ArrowRight");

            expect(player.rightKey).toBe(true);
        });

        it("should ignore unknown keys", () => {
            const player = createPlayer();

            player.keyPressed("Space");

            expect(player.downKey).toBe(false);
            expect(player.upKey).toBe(false);
            expect(player.leftKey).toBe(false);
            expect(player.rightKey).toBe(false);
        });
    });

    describe("keyReleased", () => {
        it("should release downKey", () => {
            const player = createPlayer();

            player.keyPressed("ArrowDown");
            player.keyReleased("ArrowDown");

            expect(player.downKey).toBe(false);
        });

        it("should release upKey", () => {
            const player = createPlayer();

            player.keyPressed("ArrowUp");
            player.keyReleased("ArrowUp");

            expect(player.upKey).toBe(false);
        });

        it("should release leftKey", () => {
            const player = createPlayer();

            player.keyPressed("ArrowLeft");
            player.keyReleased("ArrowLeft");

            expect(player.leftKey).toBe(false);
        });

        it("should release rightKey", () => {
            const player = createPlayer();

            player.keyPressed("ArrowRight");
            player.keyReleased("ArrowRight");

            expect(player.rightKey).toBe(false);
        });

        it("should ignore unknown keys", () => {
            const player = createPlayer();

            player.keyPressed("ArrowLeft");
            player.keyReleased("Space");

            expect(player.leftKey).toBe(true);
        });
    });

    describe("moveDown", () => {
        it("should move the piece down when there is no collision", () => {
            const player = createPlayer();

            const initialY = player.piece.center.y;

            player.moveDown();

            expect(player.piece.center.y).toBe(
                initialY + 1,
            );
        });

        it("should place the piece on the board when it collides", () => {
            const player = createPlayer();

            player.piece.center.y = 19;

            const listener = vi.fn();
            player.playerEmitter.on("piecedown", listener);

            player.moveDown();

            expect(listener).toHaveBeenCalledOnce();
            expect(listener).toHaveBeenCalledWith(
                player.piece.id,
            );
        });

        it("should write the piece colors to the board after collision", () => {
            const player = createPlayer(
                "Player",
                "player-1",
                PieceType.O,
            );

            player.piece.center.y = 19.5;

            player.moveDown();

            expect(
                player.board.some(
                    color => color === player.piece.color,
                ),
            ).toBe(true);
        });
    });

    describe("move", () => {
        it("should move right when rightKey is pressed", () => {
            const player = createPlayer();

            player.rightKey = true;

            const initialX = player.piece.center.x;

            player.move();

            expect(player.piece.center.x).toBe(
                initialX + 1,
            );
        });

        it("should move left when leftKey is pressed", () => {
            const player = createPlayer();

            player.leftKey = true;

            const initialX = player.piece.center.x;

            player.move();

            expect(player.piece.center.x).toBe(
                initialX - 1,
            );
        });

        it("should not move horizontally when no key is pressed", () => {
            const player = createPlayer();

            const initialX = player.piece.center.x;

            player.move();

            expect(player.piece.center.x).toBe(initialX);
        });

        it("should not rotate when upKey is held", () => {
            const player = createPlayer(
                "Player",
                "player-1",
                PieceType.T,
            );

            player.upKey = true;

            const originalTiles = player.piece.tiles.map(
                tile => [tile.x, tile.y],
            );

            player.move();

            expect(
                player.piece.tiles.map(
                    tile => [tile.x, tile.y],
                ),
            ).toEqual(originalTiles);
        });

        it("should not move a piece of a player who lost", () => {
            const player = createPlayer();

            player.lost = true;
            player.rightKey = true;

            const initialX = player.piece.center.x;

            player.move();

            expect(player.piece.center.x).toBe(initialX);
        });
    });

    describe("row clearing", () => {
        it("should shift the top-left cell down when a row is cleared", () => {
            const player = createPlayer();

            player.board[0] = Color.O;
            for (let x = 0; x < 10; x++)
                player.board[5 * 10 + x] = Color.O;

            player.checkCompletedRows();

            expect(player.board[0]).toBe(Color.Empty);
            expect(player.board[10]).toBe(Color.O);
        });
    });

    describe("responsive controls", () => {
        const tilesOf = (player: Player) =>
            // "+ 0" turns the -0 produced by rotations into 0.
            player.piece.tiles.map(tile => [tile.x + 0, tile.y + 0]);

        it("should shift right as soon as ArrowRight is pressed", () => {
            const player = createPlayer();
            const initialX = player.piece.center.x;

            player.keyPressed("ArrowRight", 1000);

            expect(player.piece.center.x).toBe(initialX + 1);
        });

        it("should shift left as soon as ArrowLeft is pressed", () => {
            const player = createPlayer();
            const initialX = player.piece.center.x;

            player.keyPressed("ArrowLeft", 1000);

            expect(player.piece.center.x).toBe(initialX - 1);
        });

        it("should keep the shift of a quick tap released before the next tick", () => {
            const player = createPlayer();
            const initialX = player.piece.center.x;

            player.keyPressed("ArrowRight", 1000);
            player.keyReleased("ArrowRight");
            player.move(1010);

            expect(player.piece.center.x).toBe(initialX + 1);
        });

        it("should wait before auto-repeating a held shift", () => {
            const player = createPlayer();
            const initialX = player.piece.center.x;

            player.keyPressed("ArrowRight", 1000);
            player.move(1100);

            expect(player.piece.center.x).toBe(initialX + 1);
        });

        it("should auto-repeat a held shift after the delay", () => {
            const player = createPlayer();
            const initialX = player.piece.center.x;

            player.keyPressed("ArrowRight", 1000);
            player.move(1170);
            player.move(1220);

            expect(player.piece.center.x).toBe(initialX + 3);
        });

        it("should not repeat a key press already held", () => {
            const player = createPlayer();
            const initialX = player.piece.center.x;

            player.keyPressed("ArrowRight", 1000);
            player.keyPressed("ArrowRight", 1010);

            expect(player.piece.center.x).toBe(initialX + 1);
        });

        it("should give priority to the last pressed direction", () => {
            const player = createPlayer();
            const initialX = player.piece.center.x;

            player.keyPressed("ArrowRight", 1000);
            player.keyPressed("ArrowLeft", 1010);

            expect(player.piece.center.x).toBe(initialX);
            expect(player.leftKey).toBe(true);
            expect(player.rightKey).toBe(false);
        });

        it("should rotate once when ArrowUp is pressed", () => {
            const player = createPlayer("Player", "player-1", PieceType.T);
            const originalTiles = tilesOf(player);

            player.keyPressed("ArrowUp", 1000);
            const rotatedTiles = tilesOf(player);
            player.move(2000);

            expect(rotatedTiles).not.toEqual(originalTiles);
            expect(tilesOf(player)).toEqual(rotatedTiles);
        });

        it("should rotate again after ArrowUp is released and pressed", () => {
            const player = createPlayer("Player", "player-1", PieceType.T);
            const originalTiles = tilesOf(player);

            player.keyPressed("ArrowUp", 1000);
            player.keyReleased("ArrowUp");
            player.keyPressed("ArrowUp", 1100);
            player.keyReleased("ArrowUp");
            player.keyPressed("ArrowUp", 1200);
            player.keyReleased("ArrowUp");
            player.keyPressed("ArrowUp", 1300);

            expect(tilesOf(player)).toEqual(originalTiles);
        });

        it("should drop one row as soon as ArrowDown is pressed", () => {
            const player = createPlayer();
            const initialY = player.piece.center.y;

            player.keyPressed("ArrowDown", 1000);

            expect(player.piece.center.y).toBe(initialY + 1);
        });

        it("should keep soft dropping while ArrowDown is held", () => {
            const player = createPlayer();
            const initialY = player.piece.center.y;

            player.keyPressed("ArrowDown", 1000);
            player.move(1025);
            player.move(1050);
            player.move(1100);

            expect(player.piece.center.y).toBe(initialY + 3);
        });

        it("should clear completed rows right after a hard drop", () => {
            const player = createPlayer("Player", "player-1", PieceType.I);

            for (let x = 0; x < 10; x++) {
                if (x < 3 || x > 6)
                    player.board[19 * 10 + x] = Color.O;
            }

            player.keyPressed(" ", 1000);

            expect(player.board.slice(190).every(color => color === Color.Empty)).toBe(true);
        });

        it("should kick off the left wall when rotating against it", () => {
            const player = createPlayer("Player", "player-1", PieceType.T);

            player.piece.center.y = 5;
            player.keyPressed("ArrowUp", 1000);
            player.keyReleased("ArrowUp");
            player.piece.center.x = 0;
            player.keyPressed("ArrowUp", 1100);

            expect(player.piece.center.x).toBe(1);
            expect(tilesOf(player)).toEqual([[1, 0], [0, 0], [-1, 0], [0, 1]]);
        });

        it("should kick up when rotating against the floor", () => {
            const player = createPlayer("Player", "player-1", PieceType.T);

            player.piece.center.y = 19;
            player.keyPressed("ArrowUp", 1000);

            expect(player.piece.center.y).toBe(18);
            expect(player.piece.center.x).toBe(4);
        });

        it("should not rotate when no kick fits", () => {
            const player = createPlayer("Player", "player-1", PieceType.T);

            player.piece.center.y = 5;
            player.keyPressed("ArrowUp", 1000);
            player.keyReleased("ArrowUp");
            player.piece.center.x = 0;
            for (let y = 3; y <= 8; y++) {
                player.board[y * 10 + 1] = Color.O;
                player.board[y * 10 + 2] = Color.O;
            }
            const tilesBefore = tilesOf(player);
            player.keyPressed("ArrowUp", 1100);

            expect(player.piece.center.x).toBe(0);
            expect(player.piece.center.y).toBe(5);
            expect(tilesOf(player)).toEqual(tilesBefore);
        });

        it("should ignore keys once the player lost", () => {
            const player = createPlayer();
            const initialX = player.piece.center.x;

            player.lost = true;
            player.keyPressed("ArrowRight", 1000);

            expect(player.rightKey).toBe(false);
            expect(player.piece.center.x).toBe(initialX);
        });
    });

    describe("checkCompletedRows", () => {
        it("should return zero when there are no completed rows", () => {
            const player = createPlayer();

            expect(player.checkCompletedRows()).toBe(0);
        });

        it("should delete a completed row", () => {
            const player = createPlayer();

            for (let i = 0; i < 10; i++) {
                player.board[i] = Color.O;
            }

            expect(player.checkCompletedRows()).toBe(1);

            expect(
                player.board.slice(0, 10),
            ).toEqual(
                new Array(10).fill(Color.Empty),
            );
        });

        it("should return the number of deleted rows", () => {
            const player = createPlayer();

            for (let i = 0; i < 10; i++) {
                player.board[i] = Color.O;
            }

            for (let i = 10; i < 20; i++) {
                player.board[i] = Color.I;
            }

            expect(player.checkCompletedRows()).toBe(2);
        });

        it("should emit deletedrows when more than one row is deleted", () => {
            const player = createPlayer(
                "Player",
                "player-42",
            );

            for (let i = 0; i < 20; i++) {
                player.board[i] = Color.O;
            }

            const listener = vi.fn();

            player.playerEmitter.on(
                "deletedrows",
                listener,
            );

            player.checkCompletedRows();

            expect(listener).toHaveBeenCalledOnce();
            expect(listener).toHaveBeenCalledWith(
                "player-42",
                2,
            );
        });

        it("should not emit deletedrows for one row", () => {
            const player = createPlayer();

            for (let i = 0; i < 10; i++) {
                player.board[i] = Color.O;
            }

            const listener = vi.fn();

            player.playerEmitter.on(
                "deletedrows",
                listener,
            );

            player.checkCompletedRows();

            expect(listener).not.toHaveBeenCalled();
        });

        it("should never delete penalty rows", () => {
            const player = createPlayer();

            player.addIdleRows(2);

            expect(player.checkCompletedRows()).toBe(0);
            expect(
                player.board.slice(180),
            ).toEqual(
                new Array(20).fill(Color.Idle),
            );
        });

        it("should not send penalty rows back to opponents", () => {
            const player = createPlayer();
            const listener = vi.fn();

            player.playerEmitter.on(
                "deletedrows",
                listener,
            );
            player.addIdleRows(3);
            player.checkCompletedRows();

            expect(listener).not.toHaveBeenCalled();
        });

        it("should delete a completed row above penalty rows and keep them", () => {
            const player = createPlayer();

            player.addIdleRows(1);
            player.board[175] = Color.T;
            for (let i = 180; i < 190; i++) {
                player.board[i] = Color.O;
            }

            expect(player.checkCompletedRows()).toBe(1);
            expect(player.board[185]).toBe(Color.T);
            expect(
                player.board.slice(190),
            ).toEqual(
                new Array(10).fill(Color.Idle),
            );
        });
    });

    describe("getSpectrum", () => {
        it("should return 0 for every column of an empty board", () => {
            const player = createPlayer();

            expect(player.getSpectrum()).toEqual(Array(10).fill(0));
        });

        it("should return the height of the highest block of each column", () => {
            const player = createPlayer();

            player.board[19 * 10 + 0] = Color.T;
            player.board[15 * 10 + 3] = Color.I;
            player.board[19 * 10 + 3] = Color.I;
            player.board[0 * 10 + 9] = Color.O;

            expect(player.getSpectrum()).toEqual([1, 0, 0, 5, 0, 0, 0, 0, 0, 20]);
        });

        it("should count penalty rows", () => {
            const player = createPlayer();

            player.addIdleRows(2);

            expect(player.getSpectrum()).toEqual(Array(10).fill(2));
        });
    });

    describe("addIdleRows", () => {
        it("should add one row of idle cells", () => {
            const player = createPlayer();

            player.addIdleRows(1);

            expect(
                player.board
                    .slice(player.board.length - 10)
                    .every(color => color === Color.Idle),
            ).toBe(true);
        });

        it("should add multiple rows of idle cells", () => {
            const player = createPlayer();

            player.addIdleRows(3);

            expect(
                player.board
                    .slice(player.board.length - 30)
                    .every(color => color === Color.Idle),
            ).toBe(true);
        });

        it("should move existing board contents down", () => {
            const player = createPlayer();

            player.board[0] = Color.O;

            player.addIdleRows(1);

            expect(player.board[0]).toBe(Color.Empty);
            expect(player.board[190]).toBe(Color.Idle);
            expect(player.board[199]).toBe(Color.Idle);
        });

        it("should move the piece upwards by the number of idle rows", () => {
            const player = createPlayer();

            player.piece.center.y = 10;

            player.addIdleRows(3);

            expect(player.piece.center.y).toBe(7);
        });

        it("should not move the piece above its starting position", () => {
            const player = createPlayer();

            player.piece.center.y = 3;

            player.addIdleRows(5);

            expect(player.piece.center.y).toBe(
                player.piece.startPos.y,
            );
        });

        it("should preserve the starting position", () => {
            const player = createPlayer();

            const startY = player.piece.startPos.y;

            player.addIdleRows(2);

            expect(player.piece.startPos.y).toBe(startY);
        });
    });

    describe("collision and boundaries", () => {
        it("should not move left outside the board", () => {
            const player = createPlayer();

            player.piece.center.x = 0;
            player.leftKey = true;

            player.move();

            expect(player.piece.center.x).toBe(0);
        });

        it("should not move right outside the board", () => {
            const player = createPlayer();

            player.piece.center.x = 9;
            player.rightKey = true;

            player.move();

            expect(player.piece.center.x).toBe(9);
        });

        it("should stop moving down at the bottom of the board", () => {
            const player = createPlayer();

            player.piece.center.y = 19;

            const initialY = player.piece.center.y;

            player.moveDown();

            expect(player.piece.center.y).toBe(initialY);
        });

        it("should lose when a downward collision happens at the start position", () => {
            const player = createPlayer();

            player.piece.center.y = player.piece.startPos.y;

            for (let i = 0; i < 30; i++) {
                player.board[i] = Color.O;
            }

            const listener = vi.fn();

            player.playerEmitter.on("lost", listener);

            player.moveDown();

            expect(player.lost).toBe(true);
            expect(listener).toHaveBeenCalledWith(
                player.playerId,
            );
        });

        it("should not move into an occupied cell", () => {
            const player = createPlayer();

            player.board[4 + 1 * 10] = Color.O;

            player.piece.center.x = 4;
            player.piece.center.y = 1;
            player.rightKey = true;

            player.move();

            expect(player.piece.center.x).toBe(4);
        });
    });

    describe("independent key states", () => {
        it("should allow multiple keys to be pressed simultaneously", () => {
            const player = createPlayer();

            player.keyPressed("ArrowLeft");
            player.keyPressed("ArrowUp");
            player.keyPressed("ArrowDown");

            expect(player.leftKey).toBe(true);
            expect(player.upKey).toBe(true);
            expect(player.downKey).toBe(true);
            expect(player.rightKey).toBe(false);
        });

        it("should release only the requested key", () => {
            const player = createPlayer();

            player.keyPressed("ArrowLeft");
            player.keyPressed("ArrowRight");

            player.keyReleased("ArrowLeft");

            expect(player.leftKey).toBe(false);
            expect(player.rightKey).toBe(true);
        });
    });
});
