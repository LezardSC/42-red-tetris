<script lang="ts">
import { onDestroy } from 'svelte';
import type { Socket } from 'socket.io-client';
import { connect, disconnect, getSocket, type GameStatus, type RoomStatus } from './lib/socket';

const TILE = 50;
const COLS = 10;
const MAX_LOG = 30;

let connected: boolean = $state(false);
let socketId: string = $state('');
let roomId: string = $state('A');
let roomStatus: RoomStatus | null = $state(null);
let gameTime: number | null = $state(null);
let log: string[] = $state([]);
let canvas: HTMLCanvasElement | undefined = $state();

function addLog(line: string): void {
    console.log(line);
    log = [`${new Date().toLocaleTimeString()}  ${line}`, ...log].slice(0, MAX_LOG);
}

/*------On socket opening-------*/
function onConnect(): void {
    if (getSocket()) {
        addLog('This client already possesses a socket.');
        return;
    }
    const socket: Socket = connect();

    socket.on('connect', () => {
        connected = true;
        socketId = socket.id ?? '';
    });

    socket.on('disconnect', (reason) => {
        connected = false;
        addLog(`disconnected: ${reason}`);
    });

    socket.on('connect_error', (err) => addLog(`connect_error: ${err.message}`));

    socket.on('handshake', () => addLog(`handshake, socket ${socket.id}`));

    socket.on('roomstatus', (status: RoomStatus) => {
        roomStatus = status;
        addLog(`roomstatus: ${status.name}, host ${status.host}, ${status.players.length}/${status.maxPlayers} players`);
    });

    socket.on('gamestarting', () => addLog('gamestarting'));

    socket.on('gamestatus', (status: GameStatus) => {
        gameTime = status.time;
        draw(status);
    });
}

function onDisconnect(): void {
    disconnect();
    connected = false;
    socketId = '';
    roomStatus = null;
    gameTime = null;
}

/*------Room tests-------*/
function emit(event: string, arg?: string): void {
    const socket = getSocket();
    if (!socket) {
        addLog(`not connected, cannot emit '${event}'`);
        return;
    }
    socket.emit(event, arg);
    addLog(`emit ${event}${arg !== undefined ? ` ${arg}` : ''}`);
}

/*------Game management-------*/
function draw(status: GameStatus): void {
    const ctx = canvas?.getContext('2d');
    const player = status.players[0]?.[1];
    if (!canvas || !ctx || !player) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.board.forEach((tile, i) => {
        ctx.fillStyle = `rgb(${tile[0]}, ${tile[1]}, ${tile[2]})`;
        ctx.fillRect(TILE * (i % COLS), TILE * Math.floor(i / COLS), TILE, TILE);
    });

    const p = player.piece;
    ctx.fillStyle = `rgb(${p.color[0]}, ${p.color[1]}, ${p.color[2]})`;
    p.tiles.forEach(t => {
        ctx.fillRect(TILE * (t.x + p.center.x), TILE * (t.y + p.center.y), TILE, TILE);
    });
}

function onKey(type: 'keydown' | 'keyup', event: KeyboardEvent): void {
    const socket = getSocket();
    // Don't steal keys while typing the room name
    if (!socket || event.target instanceof HTMLInputElement) return;
    if (event.key.startsWith('Arrow') || event.key === ' ') event.preventDefault();
    socket.emit(type, event.key);
}

onDestroy(onDisconnect);
</script>

<svelte:window onkeydown={e => onKey('keydown', e)} onkeyup={e => onKey('keyup', e)} />

<main class="max-w-6xl mx-auto px-4 pb-12 flex flex-col lg:flex-row gap-8 text-slate-200 relative z-10">
    <div class="flex flex-col gap-8 lg:w-96 shrink-0">
        <section class="glass-panel flex flex-col gap-4">
            <h2 class="arcade-heading text-cyan-400 m-0">Socket</h2>
            <p class="text-sm text-slate-400">
                {#if connected}
                    Connected as <span class="text-cyan-400 break-all">{socketId}</span>
                {:else}
                    Disconnected
                {/if}
            </p>
            <div class="flex gap-3">
                <button class="arcade-btn btn-cyan" onclick={onConnect} disabled={connected}>Connect</button>
                <button class="arcade-btn btn-red" onclick={onDisconnect} disabled={!connected}>Disconnect</button>
            </div>
        </section>

        <section class="glass-panel flex flex-col gap-4">
            <h2 class="arcade-heading text-red-400 m-0">Room</h2>
            <input type="text" bind:value={roomId} class="arcade-input" placeholder="Room name" />
            <div class="flex gap-3 flex-wrap">
                <button class="arcade-btn btn-cyan" onclick={() => emit('join', roomId)} disabled={!connected}>Join</button>
                <button class="arcade-btn btn-red" onclick={() => emit('leave')} disabled={!connected}>Leave</button>
                <button class="arcade-btn btn-cyan" onclick={() => emit('start')} disabled={!connected}>Start</button>
            </div>
            {#if roomStatus}
                <div class="text-sm text-slate-400 flex flex-col gap-1">
                    <p>Room <span class="text-slate-100">{roomStatus.name}</span> · {roomStatus.players.length}/{roomStatus.maxPlayers}</p>
                    <ul>
                        {#each roomStatus.players as player (player)}
                            <li class="break-all">
                                {player}
                                {#if player === roomStatus.host}<span class="text-amber-400">(host)</span>{/if}
                                {#if player === socketId}<span class="text-cyan-400">(you)</span>{/if}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </section>

        <section class="glass-panel flex flex-col gap-2">
            <h2 class="arcade-heading text-cyan-400 m-0">Events</h2>
            <ul class="text-xs font-mono text-slate-400 flex flex-col gap-1 max-h-64 overflow-y-auto">
                {#each log as line, i (i)}
                    <li class="break-all">{line}</li>
                {/each}
            </ul>
        </section>
    </div>

    <section class="glass-panel flex flex-col gap-4 items-center">
        <h2 class="arcade-heading text-red-400 m-0">Game {gameTime !== null ? `· t=${gameTime}` : ''}</h2>
        <canvas bind:this={canvas} width="500" height="1000" class="max-w-full h-auto border border-slate-700 bg-slate-950"></canvas>
    </section>
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

    .arcade-input {
        @apply bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 outline-none;
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
        @apply border-cyan-400 bg-cyan-950;
    }

    .btn-red {
        @apply bg-slate-800 text-red-400 border-red-500/30;
    }
    .btn-red:hover:not(:disabled) {
        @apply border-red-400 bg-red-950;
    }
</style>
