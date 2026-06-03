<script lang="ts">
import { router } from 'tinro';

const mockRooms = [
    { name: 'Room1', playerCount: 2, maxPlayers: 4, createdAt: Date.now() - 60000 },
    { name: 'Room2', playerCount: 1, maxPlayers: 6, createdAt: Date.now() - 120000 },
    { name: 'Room3', playerCount: 3, maxPlayers: 4, createdAt: Date.now() - 180000 },
    { name: 'Room4', playerCount: 2, maxPlayers: 2, createdAt: Date.now() - 240000 },
]

let username: string = $state('')
let roomName: string = $state('')

const listRooms = $derived(
    mockRooms
        .filter(room => room.playerCount < room.maxPlayers)
        .sort((a, b) => b.createdAt - a.createdAt)
);

function joinRoom(roomName: string) {
    if (username) {
        router.goto(`/${roomName}/${username}`);
    } else {
        alert('Please enter a username before joining a room.');
    }
}
</script>

<h1>Red Tetris</h1>

<p>Enter your username to start playing:</p>
<input type="text" bind:value={username} placeholder="Username" />
{#if username}
<p>Welcome, {username}!</p>
{/if}

<p>Available rooms:</p>
{#if listRooms.length > 0}
    <ul>
        {#each listRooms as room}
        <li>
            {room.name} ({room.playerCount}/{room.maxPlayers}) <button onclick={() => joinRoom(room.name)}>Join</button>
        </li>
        {/each}
    </ul>
{:else}
    <p>No available rooms.</p>
{/if}


<p>Create a new room:</p>
<input type="text" bind:value={roomName} placeholder="Room name" />
<button onclick={() => joinRoom(roomName)}>Create Room</button>