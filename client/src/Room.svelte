<script lang="ts">
import { onDestroy } from 'svelte';
import { router } from 'tinro';
import Game from './Game.svelte';
import GameOver from './GameOver.svelte';
import {
    connection,
    game,
    joinRoom,
    leaveRoom,
    player,
    registerUsername,
    room as currentRoom,
    startGame,
} from './lib/socket.svelte';
import { nameError } from './lib/validation';

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

function emptySlots(status: RoomStatus): number[] {
    return Array.from({ length: Math.max(status.max - status.players.length, 0) }, (_, i) => i);
}

type Outcome = 'victory' | 'defeat' | 'solo';

function outcomeOf(name: string, winnerName: string | null, isSolo: boolean): Outcome {
    if (isSolo) return 'solo';
    return winnerName === name ? 'victory' : 'defeat';
}

const paramError: string = $derived(nameError(room, 'Room name') || nameError(username, 'Username'));
let joinError: string = $state('');
let joining: boolean = false;

const error: string = $derived(paramError || joinError);

async function enterRoom(roomName: string, playerName: string): Promise<void> {
    joining = true;
    leaveRoom();
    if (player.name !== playerName) {
        joinError = await registerUsername(playerName);
    }
    if (!joinError) {
        joinError = await joinRoom(roomName);
    }
    joining = false;
}

$effect(() => {
    if (paramError || joinError || joining || !connection.connected || currentRoom.id === room) return;
    enterRoom(room, username);
});

onDestroy(leaveRoom);

const status: RoomStatus | null = $derived(
    currentRoom.status && {
        name: currentRoom.status.id,
        host: currentRoom.status.host ?? '',
        players: currentRoom.status.players
            .filter((name): name is string => name !== undefined)
            .map(name => ({ name, alive: !game.lost.includes(name) })),
        max: currentRoom.status.maxPlayers,
        inGame: currentRoom.status.gameOngoing,
    }
);
const isHost: boolean = $derived(status?.host === username);
const isOut: boolean = $derived(game.lost.includes(username));
const outcome: Outcome | null = $derived(game.result && outcomeOf(username, game.result.winner, game.solo));

const RESULT_TITLES: Record<Outcome, string> = {
    victory: 'Victory!',
    defeat: 'Defeat',
    solo: 'Game over',
};

function quitRoom(): void {
    leaveRoom();
    router.goto('/');
}
</script>

<main class="{status?.inGame ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 pb-12 flex flex-col gap-8 text-slate-200 relative z-10">

    {#if error}
        <section class="glass-panel flex flex-col items-center gap-6 text-center">
            <h2 class="arcade-heading text-red-400 m-0">Cannot join room</h2>
            <p class="text-slate-400">{error}</p>
            <button class="arcade-btn btn-cyan" onclick={quitRoom}>Back to home</button>
        </section>
    {:else if !status}
        <section class="glass-panel flex flex-col items-center gap-6 text-center">
            <p class="text-slate-400">Joining <strong class="text-cyan-400">{room}</strong><span class="dots"></span></p>
        </section>
    {:else if status.inGame}
        <Game {username} players={status.players} onLeave={quitRoom} />
        {#if isOut}
            <GameOver onQuit={quitRoom} />
        {/if}
    {:else}
        {#if game.result && outcome}
            <section class="glass-panel result-banner {outcome} flex flex-col sm:flex-row items-center justify-between gap-2">
                <h2 class="arcade-heading m-0">{RESULT_TITLES[outcome]}</h2>
                <p class="text-slate-300">
                    {#if outcome === 'victory'}
                        You were the last one standing.
                    {:else if outcome === 'solo'}
                        The stack reached the top.
                    {:else if game.result.winner}
                        <strong class="text-amber-400">{game.result.winner}</strong> won the last round.
                    {:else}
                        Nobody survived the last round.
                    {/if}
                </p>
            </section>
        {/if}
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
                    <button class="arcade-btn btn-red" onclick={quitRoom}>Leave</button>
                    <button class="arcade-btn btn-cyan" onclick={startGame}>Start game</button>
                </div>
            {:else}
                <p class="text-slate-400 text-center sm:text-left">
                    Waiting for <strong class="text-amber-400">{status.host}</strong> to start the game<span class="dots"></span>
                </p>
                <div class="flex gap-3">
                    <button class="arcade-btn btn-red" onclick={quitRoom}>Leave</button>
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

    .result-banner {
        @apply py-4 md:py-5;
    }
    .victory {
        @apply border-amber-400/60 text-amber-400;
    }
    .defeat {
        @apply border-red-500/60 text-red-400;
    }
    .solo {
        @apply border-cyan-500/60 text-cyan-400;
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
