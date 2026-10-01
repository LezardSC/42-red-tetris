import { connect, disconnect, game, lobby, resetUsername } from '../src/lib/socket.svelte';
import { goto } from '../src/lib/router.svelte';
import type { FakeSocket } from './fakeSocket';

export const STATUS = { id: 'lobby', host: 'alice', players: ['alice', 'bob'], maxPlayers: 4, gameOngoing: false };

export function openSession(fake: FakeSocket): void {
    connect();
    fake.connectNow();
}

export function closeSession(fake: FakeSocket): void {
    fake.serverEmit('disconnect');
    disconnect();
    resetUsername();
    lobby.rooms = [];
    Object.assign(game, { solo: false, lost: [], result: null, state: null });
    goto('/', true);
}
