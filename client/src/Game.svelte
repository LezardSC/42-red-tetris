<script lang="ts">
import { connection, game, sendKey, type PlayerState } from './lib/socket.svelte';
import { EMPTY_CELLS, boardCells, spectrum, spectrumCells, type Cell } from './lib/board';

type Player = { name: string; alive: boolean };

let { username, players, onLeave }: {
    username: string;
    players: Player[];
    onLeave: () => void;
} = $props();

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

const GAME_KEYS: string[] = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];

const alive: boolean = $derived(players.find(player => player.name === username)?.alive ?? false);
const statePlayers: PlayerState[] = $derived(game.state?.players.map(([, state]) => state) ?? []);
const me: PlayerState | undefined = $derived(game.state?.players.find(([id]) => id === connection.id)?.[1]);
const cells: Cell[] = $derived(me ? boardCells(me.board, me.lost ? null : me.piece) : EMPTY_CELLS);

const opponents = $derived(
    players
        .filter(player => player.name !== username)
        .map(player => ({
            name: player.name,
            alive: player.alive,
            spectrum: spectrum(statePlayers.find(state => state.playerName === player.name)?.board ?? []),
        })),
);

function onKeyDown(event: KeyboardEvent): void {
    if (!GAME_KEYS.includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat && alive) sendKey('keydown', event.key);
}

function onKeyUp(event: KeyboardEvent): void {
    if (!GAME_KEYS.includes(event.key)) return;
    event.preventDefault();
    sendKey('keyup', event.key);
}

function releaseKeys(): void {
    GAME_KEYS.forEach(key => sendKey('keyup', key));
}
</script>

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} onblur={releaseKeys} />

<div class="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">

    <section class="glass-panel flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div class="board own-board">
            {#each cells as cell, i (i)}
                <div class="cell" class:block={cell !== '.'} style:--c={COLORS[cell]}></div>
            {/each}
        </div>

        <aside class="flex flex-row sm:flex-col gap-6 sm:w-36">
            <div class="flex flex-col gap-2">
                <p class="side-label">Player</p>
                <p class="font-bold text-cyan-400 break-all">{username}</p>
            </div>

            <div class="flex flex-col gap-2 self-start">
                <button class="arcade-btn btn-red" onclick={onLeave}>Leave</button>
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
