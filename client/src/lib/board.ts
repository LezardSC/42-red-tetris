// helpers to render the `gamestatus` sent by the server.

// 'X' = indestructible penalty line, '.' = empty
export type Cell = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'X' | '.';
export type Rgb = [number, number, number];
export type Coordinates = { x: number; y: number };
export type ServerPiece = { center: Coordinates; tiles: Coordinates[]; color: Rgb };

export const ROWS = 20;
export const COLS = 10;

export const EMPTY_CELLS: readonly Cell[] = Array(ROWS * COLS).fill('.');

const CELL_BY_RGB: Record<string, Cell> = {
    '254,251,52': 'O',
    '1,237,250': 'I',
    '234,20,28': 'S',
    '57,137,47': 'Z',
    '254,72,25': 'L',
    '221,10,178': 'J',
    '120,37,111': 'T',
    '128,128,128': 'X',
    '255,255,255': '.',
};

export function toCell(color: Rgb | null | undefined): Cell {
    return (color && CELL_BY_RGB[color.join(',')]) || '.';
}

function pieceIndexes(piece: ServerPiece): number[] {
    return piece.tiles
        .map(tile => ({ x: Math.round(tile.x + piece.center.x), y: Math.round(tile.y + piece.center.y) }))
        .filter(({ x, y }) => x >= 0 && x < COLS && y >= 0 && y < ROWS)
        .map(({ x, y }) => y * COLS + x);
}

export function boardCells(board: Rgb[], piece: ServerPiece | null): Cell[] {
    const cells = board.map(toCell);
    if (!piece) return cells;
    const covered = new Set(pieceIndexes(piece));
    const pieceCell = toCell(piece.color);
    return cells.map((cell, i) => (covered.has(i) ? pieceCell : cell));
}

export function spectrumCells(heights: number[]): boolean[] {
    return Array.from({ length: ROWS }, (_, r) => r).flatMap(r => heights.map(height => ROWS - r <= height));
}
