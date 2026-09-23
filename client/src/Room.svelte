<script lang="ts">
import { router } from 'tinro';
import Game from './Game.svelte';

type Player = {
    name: string;
    alive: boolean;
};

type RoomStatus = {
    name: string;
    host: string;
    players: Player[];
    max: number;
    inGame: boolean;
};

let { room, username }: { room: string; username: string } = $props();

const regex: RegExp = /^[a-zA-Z0-9_]+$/;
const MAX_PLAYERS = 4;

// MOCK: players already present in the rooms listed on the front page.
// To be replaced by the `room:status` event once the socket is wired.
const mockRoomPlayers: Record<string, string[]> = {
    Room1: ['alice', 'bob'],
    Hyper_zone: ['neo'],
    yomama: ['kevin', 'sarah', 'tom'],
};

function mockJoin(roomName: string, playerName: string): RoomStatus {
    const others = (mockRoomPlayers[roomName] ?? []).filter(name => name !== playerName);
    const names = [...others, playerName];

    return {
        name: roomName,
        host: names[0],
        players: names.map(name => ({ name, alive: true })),
        max: MAX_PLAYERS,
        inGame: false,
    };
}

function validateParams(roomName: string, playerName: string): string {
    if (!regex.test(roomName)) return 'Invalid room name: only letters, numbers, and underscores are allowed.';
    if (!regex.test(playerName)) return 'Invalid username: only letters, numbers, and underscores are allowed.';
    return '';
}

function emptySlots(status: RoomStatus): number[] {
    return Array.from({ length: Math.max(status.max - status.players.length, 0) }, (_, i) => i);
}

// MOCK: flipped by `startGame` until the server's `room:status` does it.
let started: boolean = $state(false);

const error: string = $derived(validateParams(room, username));
const status: RoomStatus | null = $derived(error ? null : { ...mockJoin(room, username), inGame: started });
const isHost: boolean = $derived(status?.host === username);

function startGame(): void {
    // TODO: emit `game:start` once the socket is wired.
    console.log(`[mock] ${username} starts the game in room ${room}`);
    started = true;
}

function leaveRoom(): void {
    // TODO: emit `room:leave` once the socket is wired.
    router.goto('/');
}
</script>

<main class="{status?.inGame ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 pb-12 flex flex-col gap-8 text-slate-200 relative z-10">

    {#if error || !status}
        <section class="glass-panel flex flex-col items-center gap-6 text-center">
            <h2 class="arcade-heading text-red-400 m-0">Cannot join room</h2>
            <p class="text-slate-400">{error}</p>
            <button class="arcade-btn btn-cyan" onclick={leaveRoom}>Back to home</button>
        </section>
    {:else if status.inGame}
        <Game {username} players={status.players} onLeave={leaveRoom} />
    {:else}
        <section class="glass-panel flex flex-col gap-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Room</p>
                    <h2 class="arcade-heading text-cyan-400 m-0 break-all">{status.name}</h2>
                </div>
                <span class="text-sm text-slate-400 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-700/50 self-start sm:self-auto">
                    {status.players.length}/{status.max} players
                </span>
            </div>

            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#each status.players as player (player.name)}
                    <li
                        class="flex items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-lg border transition-colors"
                        class:border-cyan-500={player.name === username}
                        class:border-slate-700={player.name !== username}
                    >
                        <span class="font-bold text-slate-100 truncate">
                            {player.name}
                            {#if player.name === username}
                                <span class="text-xs font-normal text-cyan-400 ml-1">(you)</span>
                            {/if}
                        </span>
                        {#if player.name === status.host}
                            <span class="host-badge">Host</span>
                        {/if}
                    </li>
                {/each}
                {#each emptySlots(status) as slot (slot)}
                    <li class="flex items-center justify-center p-4 rounded-lg border border-dashed border-slate-700/60 text-slate-600 italic text-sm">
                        Waiting for player…
                    </li>
                {/each}
            </ul>
        </section>

        <section class="glass-panel flex flex-col sm:flex-row items-center justify-between gap-4">
            {#if isHost}
                <p class="text-slate-400 text-center sm:text-left">
                    You are the host. Start the game when everyone is ready.
                </p>
                <div class="flex gap-3">
                    <button class="arcade-btn btn-red" onclick={leaveRoom}>Leave</button>
                    <button class="arcade-btn btn-cyan" onclick={startGame}>Start game</button>
                </div>
            {:else}
                <p class="text-slate-400 text-center sm:text-left">
                    Waiting for <strong class="text-amber-400">{status.host}</strong> to start the game<span class="dots"></span>
                </p>
                <div class="flex gap-3">
                    <button class="arcade-btn btn-red" onclick={leaveRoom}>Leave</button>
                    <!-- MOCK: stands in for the host starting the game from another client -->
                    <button class="arcade-btn btn-cyan" onclick={startGame}>[mock] Host starts</button>
                </div>
            {/if}
        </section>
    {/if}
</main>

<style>
    @reference "./main.css";

    .arcade-heading {
        font-family: 'Press Start 2P', system-ui, sans-serif;
        font-size: 1rem;
        letter-spacing: 1px;
        line-height: 1.5;
    }

    .glass-panel {
        @apply bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl;
    }

    .host-badge {
        @apply text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-2 py-1 shrink-0;
    }

    .arcade-btn {
        @apply font-bold rounded-lg px-6 py-3 transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed;
        font-family: system-ui, sans-serif;
        letter-spacing: 0.5px;
    }

    .btn-cyan {
        @apply bg-slate-800 text-cyan-400 border-cyan-500/30;
    }
    .btn-cyan:hover:not(:disabled) {
        @apply border-cyan-400 bg-cyan-950 shadow-[0_0_15px_rgba(0,255,255,0.3)];
    }

    .btn-red {
        @apply bg-slate-800 text-red-400 border-red-500/30;
    }
    .btn-red:hover:not(:disabled) {
        @apply border-red-400 bg-red-950 shadow-[0_0_15px_rgba(255,0,51,0.3)];
    }

    .dots::after {
        content: '';
        animation: dots 1.5s steps(4, end) infinite;
    }

    @keyframes dots {
        0%   { content: ''; }
        25%  { content: '.'; }
        50%  { content: '..'; }
        75%  { content: '...'; }
    }
</style>
