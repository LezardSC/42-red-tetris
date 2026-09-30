import { describe, expect, it, vi } from "vitest";
import {
    PieceType,
    Color,
    Piece,
    Coordinates,
    PieceManager,
} from "../src/back/piece.ts";

describe("Coordinates", () => {
    describe("constructor", () => {
        it("should initialize x and y", () => {
            const coordinates = new Coordinates(3, 5);

            expect(coordinates.x).toBe(3);
            expect(coordinates.y).toBe(5);
        });
    });

    describe("equals", () => {
        it("should return true for equal coordinates", () => {
            const coordinates = new Coordinates(3, 5);
            const other = new Coordinates(3, 5);

            expect(coordinates.equals(other)).toBe(true);
        });

        it("should return false when x differs", () => {
            const coordinates = new Coordinates(3, 5);
            const other = new Coordinates(4, 5);

            expect(coordinates.equals(other)).toBe(false);
        });

        it("should return false when y differs", () => {
            const coordinates = new Coordinates(3, 5);
            const other = new Coordinates(3, 6);

            expect(coordinates.equals(other)).toBe(false);
        });
    });

    describe("rotate", () => {
        it("should rotate 90 degrees around the origin", () => {
            const coordinates = new Coordinates(1, 0);

            coordinates.rotate(90);

            expect(coordinates.x).toBeCloseTo(0);
            expect(coordinates.y).toBeCloseTo(-1);
        });

        it("should rotate 180 degrees around the origin", () => {
            const coordinates = new Coordinates(1, 2);

            coordinates.rotate(180);

            expect(coordinates.x).toBeCloseTo(-1);
            expect(coordinates.y).toBeCloseTo(-2);
        });

        it("should rotate 270 degrees around the origin", () => {
            const coordinates = new Coordinates(1, 0);

            coordinates.rotate(270);

            expect(coordinates.x).toBeCloseTo(0);
            expect(coordinates.y).toBeCloseTo(1);
        });

        it("should rotate around a custom center", () => {
            const coordinates = new Coordinates(2, 1);
            const center = new Coordinates(1, 1);

            coordinates.rotate(90, center);

            expect(coordinates.x).toBeCloseTo(1);
            expect(coordinates.y).toBeCloseTo(0);
        });

        it("should round coordinates to one decimal place", () => {
            const coordinates = new Coordinates(1, 1);

            coordinates.rotate(45);

            expect(coordinates.x).toBeCloseTo(1.4);
            expect(coordinates.y).toBeCloseTo(0);
        });
    });
});

describe("Piece", () => {
    describe("constructor", () => {
        it("should throw when type is undefined", () => {
            expect(() => {
                new Piece(5, 5, undefined, 1);
            }).toThrow(
                "Cannot create a piece with an undefined type.",
            );
        });

        it("should initialize the piece", () => {
            const piece = new Piece(
                5,
                10,
                PieceType.T,
                42,
            );

            expect(piece.type).toBe(PieceType.T);
            expect(piece.id).toBe(42);
            expect(piece.center.x).toBe(5);
            expect(piece.center.y).toBe(10);
            expect(piece.startPos.x).toBe(5);
            expect(piece.startPos.y).toBe(10);
        });
    });

    describe("center and start position", () => {
        it("should offset O pieces by 0.5", () => {
            const piece = new Piece(
                5,
                10,
                PieceType.O,
                1,
            );

            expect(piece.center.equals(
                new Coordinates(5.5, 10.5),
            )).toBe(true);

            expect(piece.startPos.equals(
                new Coordinates(5.5, 10.5),
            )).toBe(true);
        });

        it("should offset I pieces by 0.5", () => {
            const piece = new Piece(
                5,
                10,
                PieceType.I,
                1,
            );

            expect(piece.center.equals(
                new Coordinates(5.5, 10.5),
            )).toBe(true);
        });

        it("should not offset other pieces", () => {
            const piece = new Piece(
                5,
                10,
                PieceType.T,
                1,
            );

            expect(piece.center.equals(
                new Coordinates(5, 10),
            )).toBe(true);
        });
    });

    describe("piece layouts", () => {
        it("should create the correct O piece", () => {
            const piece = new Piece(
                0,
                0,
                PieceType.O,
                1,
            );

            expect(piece.tiles.map(tile => [tile.x, tile.y]))
                .toEqual([
                    [-0.5, -0.5],
                    [0.5, -0.5],
                    [-0.5, 0.5],
                    [0.5, 0.5],
                ]);
        });

        it("should create the correct I piece", () => {
            const piece = new Piece(
                0,
                0,
                PieceType.I,
                1,
            );

            expect(piece.tiles.map(tile => [tile.x, tile.y]))
                .toEqual([
                    [-1.5, -0.5],
                    [-0.5, -0.5],
                    [0.5, -0.5],
                    [1.5, -0.5],
                ]);
        });

        it("should create the correct S piece", () => {
            const piece = new Piece(
                0,
                0,
                PieceType.S,
                1,
            );

            expect(piece.tiles.map(tile => [tile.x, tile.y]))
                .toEqual([
                    [-1, 0],
                    [0, 0],
                    [0, -1],
                    [1, -1],
                ]);
        });

        it("should create the correct Z piece", () => {
            const piece = new Piece(
                0,
                0,
                PieceType.Z,
                1,
            );

            expect(piece.tiles.map(tile => [tile.x, tile.y]))
                .toEqual([
                    [-1, -1],
                    [0, -1],
                    [0, 0],
                    [1, 0],
                ]);
        });

        it("should create the correct L piece", () => {
            const piece = new Piece(
                0,
                0,
                PieceType.L,
                1,
            );

            expect(piece.tiles.map(tile => [tile.x, tile.y]))
                .toEqual([
                    [-1, 0],
                    [0, 0],
                    [1, 0],
                    [1, -1],
                ]);
        });

        it("should create the correct J piece", () => {
            const piece = new Piece(
                0,
                0,
                PieceType.J,
                1,
            );

            expect(piece.tiles.map(tile => [tile.x, tile.y]))
                .toEqual([
                    [-1, -1],
                    [-1, 0],
                    [0, 0],
                    [1, 0],
                ]);
        });

        it("should create the correct T piece", () => {
            const piece = new Piece(
                0,
                0,
                PieceType.T,
                1,
            );

            expect(piece.tiles.map(tile => [tile.x, tile.y]))
                .toEqual([
                    [-1, 0],
                    [0, 0],
                    [1, 0],
                    [0, -1],
                ]);
        });

        it("should create exactly four tiles", () => {
            for (const type of Object.values(PieceType)) {
                const piece = new Piece(0, 0, type, 1);

                expect(piece.tiles).toHaveLength(4);
            }
        });
    });

    describe("colors", () => {
        it.each([
            [PieceType.O, Color.O],
            [PieceType.I, Color.I],
            [PieceType.S, Color.S],
            [PieceType.Z, Color.Z],
            [PieceType.L, Color.L],
            [PieceType.J, Color.J],
            [PieceType.T, Color.T],
        ])(
            "should assign the correct color to %s",
            (type, color) => {
                const piece = new Piece(
                    0,
                    0,
                    type,
                    1,
                );

                expect(piece.color).toEqual(color);
            },
        );
    });

    describe("id", () => {
        it("should preserve the provided id", () => {
            const piece = new Piece(
                0,
                0,
                PieceType.T,
                123,
            );

            expect(piece.id).toBe(123);
        });
    });
});

describe("PieceManager", () => {
    describe("constructor", () => {
        it("should generate a set of pieces", () => {
            const manager = new PieceManager();

            expect(manager.nextPieces).toHaveLength(
                Object.keys(PieceType).length,
            );
        });
    });

    describe("generateNewSet", () => {
        it("should add another complete set of pieces", () => {
            const manager = new PieceManager();

            const initialLength = manager.nextPieces.length;

            manager.generateNewSet();

            expect(manager.nextPieces).toHaveLength(
                initialLength + Object.keys(PieceType).length,
            );
        });

        it("should only generate valid piece types", () => {
            const manager = new PieceManager();

            for (const piece of manager.nextPieces) {
                expect(
                    Object.values(PieceType),
                ).toContain(piece);
            }
        });

        it("should generate every piece type exactly once per set", () => {
            vi.spyOn(Math, "random").mockReturnValue(0.5);

            const manager = new PieceManager();

            expect(
                [...manager.nextPieces].sort(),
            ).toEqual(
                [...Object.values(PieceType)].sort(),
            );

            vi.restoreAllMocks();
        });

        it("should generate multiple complete sets", () => {
            const manager = new PieceManager();

            manager.generateNewSet();
            manager.generateNewSet();

            expect(manager.nextPieces).toHaveLength(
                Object.keys(PieceType).length * 3,
            );

            const firstSet = manager.nextPieces.slice(0, 7);
            const secondSet = manager.nextPieces.slice(7, 14);
            const thirdSet = manager.nextPieces.slice(14, 21);

            expect([...firstSet].sort()).toEqual(
                [...Object.values(PieceType)].sort(),
            );

            expect([...secondSet].sort()).toEqual(
                [...Object.values(PieceType)].sort(),
            );

            expect([...thirdSet].sort()).toEqual(
                [...Object.values(PieceType)].sort(),
            );
        });
    });
});
