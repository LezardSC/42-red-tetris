import { describe, expect, it } from 'vitest';
import { COLS, EMPTY_CELLS, ROWS, boardCells, spectrumCells, toCell, type Rgb, type ServerPiece } from '../src/lib/board';

const WHITE: Rgb = [255, 255, 255];
const YELLOW: Rgb = [254, 251, 52];
const GREY: Rgb = [128, 128, 128];

const emptyBoard = (): Rgb[] => Array.from({ length: ROWS * COLS }, () => WHITE);

describe('toCell', () => {
    it('maps every server colour to its piece letter', () => {
        expect(toCell([254, 251, 52])).toBe('O');
        expect(toCell([1, 237, 250])).toBe('I');
        expect(toCell([234, 20, 28])).toBe('S');
        expect(toCell([57, 137, 47])).toBe('Z');
        expect(toCell([254, 72, 25])).toBe('L');
        expect(toCell([221, 10, 178])).toBe('J');
        expect(toCell([120, 37, 111])).toBe('T');
        expect(toCell(GREY)).toBe('X');
        expect(toCell(WHITE)).toBe('.');
    });

    it('treats unknown, null and undefined colours as empty', () => {
        expect(toCell([1, 2, 3])).toBe('.');
        expect(toCell(null)).toBe('.');
        expect(toCell(undefined)).toBe('.');
    });
});

describe('EMPTY_CELLS', () => {
    it('is a 10x20 board of empty cells', () => {
        expect(EMPTY_CELLS).toHaveLength(200);
        expect(EMPTY_CELLS.every(cell => cell === '.')).toBe(true);
    });
});

describe('boardCells', () => {
    it('converts the board when there is no piece', () => {
        const board = emptyBoard();
        board[199] = GREY;
        const cells = boardCells(board, null);
        expect(cells[199]).toBe('X');
        expect(cells.filter(cell => cell !== '.')).toHaveLength(1);
    });

    it('draws the piece tiles relative to its center', () => {
        const piece: ServerPiece = {
            center: { x: 4, y: 0 },
            tiles: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
            color: YELLOW,
        };
        const cells = boardCells(emptyBoard(), piece);
        expect([cells[4], cells[5], cells[14], cells[15]]).toEqual(['O', 'O', 'O', 'O']);
        expect(cells.filter(cell => cell === 'O')).toHaveLength(4);
    });

    it('rounds the rotated coordinates sent by the server', () => {
        const piece: ServerPiece = { center: { x: 2.5, y: 1.5 }, tiles: [{ x: -0.4999, y: 0.4999 }], color: YELLOW };
        const cells = boardCells(emptyBoard(), piece);
        expect(cells[2 * COLS + 2]).toBe('O');
    });

    it('ignores tiles outside the board', () => {
        const piece: ServerPiece = {
            center: { x: 0, y: 0 },
            tiles: [{ x: -1, y: 0 }, { x: COLS, y: 0 }, { x: 0, y: -1 }, { x: 0, y: ROWS }],
            color: YELLOW,
        };
        expect(boardCells(emptyBoard(), piece).every(cell => cell === '.')).toBe(true);
    });

    it('does not mutate the board it receives', () => {
        const board = emptyBoard();
        const copy = [...board];
        boardCells(board, { center: { x: 0, y: 0 }, tiles: [{ x: 0, y: 0 }], color: YELLOW });
        expect(board).toEqual(copy);
    });
});

describe('spectrumCells', () => {
    it('fills each column from the bottom up to its height', () => {
        const heights = [0, 1, 20, 0, 0, 0, 0, 0, 0, 5];
        const cells = spectrumCells(heights);
        expect(cells).toHaveLength(ROWS * COLS);
        const column = (col: number) => cells.filter((_, i) => i % COLS === col).filter(Boolean).length;
        expect(heights.map((_, col) => column(col))).toEqual(heights);
        // height 1 => only the bottom row
        expect(cells[(ROWS - 1) * COLS + 1]).toBe(true);
        expect(cells[(ROWS - 2) * COLS + 1]).toBe(false);
    });
});
