type Shape = { shape: number[][]; color: string };
export type Block = { row: number; col: number };
export type Particle = {
    id: number;
    x: number;
    size: number;
    color: string;
    cols: number;
    rows: number;
    blocks: Block[];
    clearance: number;
    duration: number;
    delay: number;
    rotation: number;
    spin: number;
};

const TETROMINOS: Shape[] = [
    { shape: [[1,1,1,1]], color: '#00FFFF' },
    { shape: [[1,0,0],[1,1,1]], color: '#0066FF' },
    { shape: [[0,0,1],[1,1,1]], color: '#FF8800' },
    { shape: [[1,1],[1,1]], color: '#FFE600' },
    { shape: [[0,1,1],[1,1,0]], color: '#00FF00' },
    { shape: [[0,1,0],[1,1,1]], color: '#CC00FF' },
    { shape: [[1,1,0],[0,1,1]], color: '#FF0033' },
];

const VALUES_PER_PARTICLE = 7;

export function nextRandom(seed: number): [number, number] {
    const next = (seed + 0x6d2b79f5) | 0;
    const a = Math.imul(next ^ (next >>> 15), next | 1);
    const b = a ^ (a + Math.imul(a ^ (a >>> 7), a | 61));
    return [((b ^ (b >>> 14)) >>> 0) / 4294967296, next];
}

export function randomSequence(seed: number, length: number): number[] {
    return Array.from({ length }).reduce<{ values: number[]; seed: number }>(
        (acc) => {
            const [value, next] = nextRandom(acc.seed);
            return { values: [...acc.values, value], seed: next };
        },
        { values: [], seed },
    ).values;
}

export function shapeBlocks(shape: number[][]): Block[] {
    return shape.flatMap((line, row) => line.flatMap((filled, col) => (filled ? [{ row, col }] : [])));
}

export function createParticle(id: number, values: number[]): Particle {
    const [rType, rX, rSize, rDuration, rDelay, rRotation, rSpin] = values;
    const { shape, color } = TETROMINOS[Math.floor(rType * TETROMINOS.length)];
    const size = 12 + rSize * 15;
    const rows = shape.length;
    const cols = shape[0].length;
    const duration = 7 + rDuration * 13;
    return {
        id,
        x: rX * 100,
        size,
        color,
        cols,
        rows,
        blocks: shapeBlocks(shape),
        clearance: Math.max(rows, cols) * size,
        duration,
        delay: -rDelay * duration,
        rotation: rRotation * Math.PI * 2,
        spin: (rSpin - 0.5) * 2 * duration,
    };
}

export function createParticles(seed: number, count: number): Particle[] {
    const values = randomSequence(seed, count * VALUES_PER_PARTICLE);
    return Array.from({ length: count }, (_, i) =>
        createParticle(i, values.slice(i * VALUES_PER_PARTICLE, (i + 1) * VALUES_PER_PARTICLE)),
    );
}
