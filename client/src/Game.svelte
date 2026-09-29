<script lang="ts">
import { mockTopOut, mockWin } from './lib/socket.svelte';

type Player = { name: string; alive: boolean };
// 'X' = indestructible penalty line, '.' = empty
type Cell = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'X' | '.';

let { username, players, onLeave }: {
    username: string;
    players: Player[];
    onLeave: () => void;
} = $props();

const ROWS = 20;

const COLORS: Record<Cell, string | null> = {
    I: '#00FFFF',
    J: '#0066FF',
    L: '#FF8800',
    O: '#FFE600',
    S: '#00FF00',
    T: '#CC00FF',
    Z: '#FF0033',
    X: '#64748B',
    '.': null,
};

// MOCK: static snapshot of the board (falling T included) and next piece,
// to be replaced by `game:state` once the socket is wired.
const MOCK_BOARD: string[] = [
    '..........',
    '..........',
    '....T.....',
    '...TTT....',
    ...Array(9).fill('..........'),
    '.........I',
    '.T.......I',
    'TTT....ZZI',
    'LJJ.OO.SZZ',
    'LJ..OOSSLI',
    'LLJJ.TTLLI',
    'XXXXXXXXXX',
];
const MOCK_NEXT: string[] = ['....', 'IIII', '....', '....'];

// MOCK: opponents' spectrums (height of each column).
const MOCK_SPECTRUMS: number[][] = [
    [3, 4, 4, 6, 7, 5, 5, 2, 3, 4],
    [8, 9, 11, 10, 9, 12, 13, 12, 10, 9],
    [15, 17, 16, 18, 19, 18, 17, 16, 18, 17],
];

function toCells(rows: string[]): Cell[] {
    return rows.flatMap(row => [...row] as Cell[]);
}

// A cell (row r, column c) is filled when it is within the column's height.
function spectrumCells(spectrum: number[]): boolean[] {
    return Array.from({ length: ROWS }, (_, r) => r).flatMap(r => spectrum.map(height => ROWS - r <= height));
}

// MOCK: spectrums until `game:state` carries them.
const opponents = $derived(
    players
        .filter(player => player.name !== username)
        .map((player, i) => ({
            name: player.name,
            alive: player.alive,
            spectrum: MOCK_SPECTRUMS[i % MOCK_SPECTRUMS.length],
        })),
);
</script>

<div class="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">

    <section class="glass-panel flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div class="board own-board">
            {#each toCells(MOCK_BOARD) as cell, i (i)}
                <div class="cell" class:block={cell !== '.'} style:--c={COLORS[cell]}></div>
            {/each}
        </div>

        <aside class="flex flex-row sm:flex-col gap-6 sm:w-36">
            <div class="flex flex-col gap-2">
                <p class="side-label">Player</p>
                <p class="font-bold text-cyan-400 break-all">{username}</p>
            </div>

            <div class="flex flex-col gap-2">
                <p class="side-label">Next</p>
                <div class="board preview">
                    {#each toCells(MOCK_NEXT) as cell, i (i)}
                        <div class:block={cell !== '.'} style:--c={COLORS[cell]}></div>
                    {/each}
                </div>
            </div>

            <div class="flex flex-col gap-2 self-start">
                <button class="arcade-btn btn-red" onclick={onLeave}>Leave</button>
                <!-- MOCK: stand in for the server ending the game -->
                {#if opponents.length > 0}
                    <button class="mock-btn" onclick={mockWin}>[mock] Win</button>
                {/if}
                <button class="mock-btn" onclick={mockTopOut}>[mock] Top out</button>
            </div>
        </aside>
    </section>

    <section class="glass-panel flex flex-col gap-6 w-full lg:w-auto">
        <h2 class="arcade-heading text-cyan-400 m-0">Opponents</h2>

        {#if opponents.length === 0}
            <p class="text-slate-400">Solo game: no opponents in this room.</p>
        {:else}
            <ul class="flex flex-wrap lg:grid lg:grid-cols-2 gap-4 justify-center">
                {#each opponents as opponent (opponent.name)}
                    <li class="flex flex-col items-center gap-2">
                        <div class="relative">
                            <div class="board mini-board" class:knocked-out={!opponent.alive}>
                                {#each spectrumCells(opponent.spectrum) as filled, i (i)}
                                    <div class="cell" class:spectrum={filled}></div>
                                {/each}
                            </div>
                            {#if !opponent.alive}
                                <span class="ko-badge">KO</span>
                            {/if}
                        </div>
                        <span class="text-sm font-bold text-slate-300 truncate max-w-24">{opponent.name}</span>
                    </li>
                {/each}
            </ul>
        {/if}
    </section>
</div>

<style>
    @reference "./main.css";

    .arcade-heading {
        font-family: 'Press Start 2P', system-ui, sans-serif;
        font-size: 1rem;
        letter-spacing: 1px;
        line-height: 1.5;
    }

    .glass-panel {
        @apply bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md shadow-xl;
    }

    .side-label {
        @apply text-xs uppercase tracking-widest text-slate-500;
    }

    .board {
        display: grid;
        grid-template-columns: repeat(var(--cols), var(--cell));
        grid-auto-rows: var(--cell);
        gap: 1px;
    }

    .own-board {
        --cols: 10;
        /* Keep the 20 rows on screen whatever the viewport height */
        --cell: clamp(0.9rem, calc((100vh - 16rem) / 20), 1.75rem);
        @apply p-1 bg-slate-950/80 border border-slate-700 rounded shadow-[0_0_25px_rgba(0,255,255,0.15)];
    }

    .preview {
        --cols: 4;
        --cell: 1rem;
    }

    .mini-board {
        --cols: 10;
        --cell: 0.5rem;
        @apply p-0.5 bg-slate-950/80 border border-slate-700 rounded;
    }

    .cell {
        @apply bg-slate-900/60 rounded-[2px];
    }

    .block {
        background-color: var(--c);
        border: 1px solid rgba(255, 255, 255, 0.6);
        box-shadow: 0 0 6px var(--c), inset 0 0 4px rgba(255, 255, 255, 0.4);
    }

    .spectrum {
        @apply bg-red-500/80;
    }

    .knocked-out {
        @apply opacity-30 grayscale;
    }

    .ko-badge {
        font-family: 'Press Start 2P', system-ui, sans-serif;
        @apply absolute inset-0 flex items-center justify-center text-red-400 text-sm;
    }

    .mock-btn {
        @apply text-xs text-slate-400 bg-slate-800/60 border border-dashed border-slate-600 rounded px-2 py-1 hover:text-slate-200 hover:border-slate-400;
    }

    .arcade-btn {
        @apply font-bold rounded-lg px-6 py-3 transition-all duration-200 border;
        font-family: system-ui, sans-serif;
        letter-spacing: 0.5px;
    }

    .btn-red {
        @apply bg-slate-800 text-red-400 border-red-500/30;
    }
    .btn-red:hover {
        @apply border-red-400 bg-red-950 shadow-[0_0_15px_rgba(255,0,51,0.3)];
    }

</style>
