<script lang="ts">
import { router } from 'tinro';
import TetrisBackground from './lib/TetrisBackground.svelte';
import HeaderTetrisBackground from './lib/TetrisHeader.svelte';

type Room = {
    name: string;
    playerCount: number;
    maxPlayers: number;
    createdAt: number;
}

const mockRooms: Room[] = [
    { name: 'Room1', playerCount: 2, maxPlayers: 4, createdAt: Date.now() - 60000 },
    { name: 'Hyper_zone', playerCount: 1, maxPlayers: 6, createdAt: Date.now() - 120000 },
    { name: 'yomama', playerCount: 3, maxPlayers: 4, createdAt: Date.now() - 180000 },
    { name: 'Room4', playerCount: 2, maxPlayers: 2, createdAt: Date.now() - 240000 },
]

const regex: RegExp = /^[a-zA-Z0-9_]+$/;

let usernameInput: string = $state('');
let username: string = $state('')
let roomName: string = $state('')

const errors = $state({
    username: '',
    createRoom: '',
});

const listRooms: Room[] = $derived(
    mockRooms
        .filter(room => room.playerCount < room.maxPlayers)
        .sort((a, b) => b.createdAt - a.createdAt)
);

function validateUsername(name: string): boolean {
    errors.username = '';

    if (!name) {
        errors.username = 'Username cannot be empty.';
        return false;
    }

    if (!regex.test(name)) {
        errors.username = 'Username can only contain letters, numbers, and underscores.';
        return false;
    }

    return true;
}

function setUsername(name: string): void {
    if (!validateUsername(name)) {
        return;
    }

    username = name;
}

function validateRoomName(name: string): boolean {
    errors.createRoom = '';

    if (!name) {
        errors.createRoom = 'Room name cannot be empty.';
        return false;
    }

    if (!regex.test(name)) {
        errors.createRoom = 'Room name can only contain letters, numbers, and underscores.';
        return false;
    }

    return true;
}

function createRoom(targetRoom: string): void {
    if (!validateRoomName(targetRoom)) {
        return;
    }

    if (username) {
        router.goto(`/${targetRoom}/${username}`);
    } else {
        errors.createRoom = 'Please enter a username before creating a room.';
    }
}

function joinRoom(targetRoom: string): void {
    if (!username || !validateUsername(username)) {
        errors.createRoom = 'Please enter a username before joining a room.';
        return;
    }
    router.goto(`/${targetRoom}/${username}`);
}
</script>


    <h2>Username</h2>
    {#if !username}
    <p>Enter your username to start playing:</p>
    <input type="text" bind:value={usernameInput} oninput={() => errors.username = ''} placeholder="Username" disabled={!!username}/>
    <button onclick={() => setUsername(usernameInput)}>Confirm</button>
    {#if errors.username}
        <p style="color: red;">{errors.username}</p>
    {/if}
    {:else}
        <p>Playing as <strong>{username}</strong></p>
        <button onclick={() => username = ''}>Change Username</button>
    {/if}

    {#if !username}
        <p>Choose a username before joining or creating a room.</p>
    {/if}

    <h2>Available rooms:</h2>

    {#if listRooms.length > 0}
        <ul>
            {#each listRooms as room}
            <li>
                {room.name} ({room.playerCount}/{room.maxPlayers})
                <button
                    disabled={!username}
                    title={!username ? 'Please enter a username to join a room' : ''}
                    onclick={() => joinRoom(room.name)}
                >
                    Join
                </button>
            </li>
            {/each}
        </ul>
    {:else}
        <p>No available rooms.</p>
    {/if}

    <h2>Create a new room:</h2>

    <input type="text" bind:value={roomName} oninput={() => errors.createRoom = ''} placeholder="Room name" />
    <button
        disabled={!username}
        title={!username ? 'Please enter a username to create a room' : ''}
        onclick={() => createRoom(roomName)}
        >
        Create Room
    </button>
    {#if errors.createRoom}
        <p style="color: red;">{errors.createRoom}</p>
    {/if}