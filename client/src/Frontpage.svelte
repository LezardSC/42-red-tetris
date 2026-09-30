<script lang="ts">
import { router } from 'tinro';
import { lobby, player, registerUsername, resetUsername, type RoomStatus } from './lib/socket.svelte';
import { nameError } from './lib/validation';

let usernameInput: string = $state('');
const username: string = $derived(player.name);
let registering: boolean = $state(false);
let roomName: string = $state('');

const errors = $state({
    username: '',
    createRoom: '',
});

const listRooms: RoomStatus[] = $derived(
    lobby.rooms
        .filter(room => room.players.length < room.maxPlayers && !room.gameOngoing)
        .toReversed()
);

async function setUsername(name: string): Promise<void> {
    errors.username = nameError(name, 'Username');
    if (errors.username) return;
    registering = true;
    errors.username = await registerUsername(name);
    registering = false;
}

function createRoom(targetRoom: string): void {
    errors.createRoom = nameError(targetRoom, 'Room name');
    if (errors.createRoom) return;

    if (username) {
        router.goto(`/${targetRoom}/${username}`);
    } else {
        errors.createRoom = 'Please enter a username before creating a room.';
    }
}

function joinRoom(targetRoom: string): void {
    if (!username) {
        errors.createRoom = 'Please enter a username before joining a room.';
        return;
    }
    router.goto(`/${targetRoom}/${username}`);
}
</script>

<main class="max-w-3xl mx-auto px-4 pb-12 flex flex-col gap-8 text-slate-200">
    
    <section class="glass-panel">
        <h2 class="arcade-heading text-cyan-400">Player Profile</h2>
        
        {#if !username}
            <p class="mb-4 text-slate-400">Enter your username to start playing:</p>
            <div class="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text" 
                    bind:value={usernameInput} 
                    oninput={() => errors.username = ''} 
                    placeholder="Enter Username"
                    maxlength="16" 
                    disabled={!!username}
                    class="arcade-input flex-1"
                />
                <button class="arcade-btn btn-cyan" disabled={registering} onclick={() => setUsername(usernameInput)}>
                    Confirm
                </button>
            </div>
            {#if errors.username}
                <p class="text-red-500 mt-2 text-sm">{errors.username}</p>
            {/if}
        {:else}
            <div class="flex items-center justify-between bg-slate-950/50 p-4 rounded-lg border border-slate-700/50">
                <p class="text-lg">Playing as <strong class="text-cyan-400 font-bold tracking-wider">{username}</strong></p>
                <button class="arcade-btn btn-red text-sm py-2 px-4" onclick={resetUsername}>
                    Change
                </button>
            </div>
        {/if}
    </section>

    <section class="glass-panel opacity-100 transition-opacity duration-300" class:opacity-50={!username}>
        <div class="grid md:grid-cols-2 gap-8">
            
            <div>
                <h2 class="arcade-heading text-red-400">Available Rooms</h2>
                
                {#if !username}
                    <p class="text-sm text-amber-400 mb-4 bg-amber-400/10 p-2 rounded border border-amber-400/20">
                        ⚠️ Choose a username first.
                    </p>
                {/if}

                {#if listRooms.length > 0}
                    <ul class="space-y-3" class:room-list-scroll={listRooms.length > 3}>
                        {#each listRooms as room (room.id)}
                            <li class="flex justify-between items-center bg-slate-800/60 p-3 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
                                <div>
                                    <span class="font-bold text-slate-100">{room.id}</span>
                                    <span class="text-xs text-slate-400 block">Players: {room.players.length}/{room.maxPlayers}</span>
                                </div>
                                <button
                                    class="arcade-btn btn-cyan py-1 px-3 text-sm"
                                    disabled={!username}
                                    title={!username ? 'Please enter a username to join' : ''}
                                    onclick={() => joinRoom(room.id)}
                                >
                                    Join
                                </button>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-slate-500 italic p-4 text-center bg-slate-900/50 rounded-lg">No available rooms at the moment.</p>
                {/if}
            </div>

            <div class="flex flex-col border-t md:border-t-0 md:border-l border-slate-700/50 pt-6 md:pt-0 md:pl-8">
                <h2 class="arcade-heading text-cyan-400">Create Room</h2>
                <div class="flex flex-col gap-3">
                    <input 
                        type="text" 
                        bind:value={roomName} 
                        oninput={() => errors.createRoom = ''} 
                        placeholder="New room name" 
                        disabled={!username}
                        class="arcade-input"
                    />
                    <button
                        class="arcade-btn btn-red w-full"
                        disabled={!username}
                        title={!username ? 'Please enter a username to create a room' : ''}
                        onclick={() => createRoom(roomName)}
                    >
                        Create & Join
                    </button>
                    {#if errors.createRoom}
                        <p class="text-red-500 text-sm mt-1">{errors.createRoom}</p>
                    {/if}
                </div>
            </div>

        </div>
    </section>
</main>

<style>
    @reference "./main.css";

    .arcade-heading {
        font-family: 'Press Start 2P', system-ui, sans-serif;
        font-size: 1rem;
        margin-bottom: 1.5rem;
        letter-spacing: 1px;
        line-height: 1.5;
    }

    .glass-panel {
        @apply bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl;
    }

    .arcade-input {
        @apply bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 outline-none transition-all focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed;
    }
    .arcade-input:focus {
        box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.1);
        @apply ring-cyan-500/50;
    }

    .room-list-scroll {
        @apply max-h-56 overflow-y-auto pr-2;
        scrollbar-width: thin;
        scrollbar-color: rgb(34 211 238 / 0.5) transparent;
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
</style>