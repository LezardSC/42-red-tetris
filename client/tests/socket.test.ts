import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeSocket, type FakeSocket } from './fakeSocket';

let fake: FakeSocket;

vi.mock('socket.io-client', () => ({ io: vi.fn(() => fake.socket) }));

// The socket module keeps its state at module level: load a fresh copy for every test.
let mod: typeof import('../src/lib/socket.svelte');

const STATUS = { id: 'lobby', host: 'alice', players: ['alice', 'bob'], maxPlayers: 4, gameOngoing: false };

beforeEach(async () => {
    vi.resetModules();
    fake = createFakeSocket();
    mod = await import('../src/lib/socket.svelte');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('connect / disconnect', () => {
    it('creates a single socket', () => {
        expect(mod.getSocket()).toBeNull();
        const s = mod.connect();
        expect(mod.getSocket()).toBe(s);
        expect(mod.connect()).toBe(s);
    });

    it('tracks the connection state', () => {
        mod.connect();
        fake.connectNow();
        expect(mod.connection).toEqual({ connected: true, id: 'socket-1' });
        fake.serverEmit('disconnect');
        expect(mod.connection).toEqual({ connected: false, id: '' });
    });

    it('uses an empty id when the socket has none', () => {
        fake.socket.id = undefined as unknown as string;
        mod.connect();
        fake.connectNow();
        expect(mod.connection.id).toBe('');
    });

    it('disconnect closes the socket and forgets it', () => {
        mod.connect();
        fake.connectNow();
        mod.disconnect();
        expect(fake.socket.disconnect).toHaveBeenCalled();
        expect(mod.getSocket()).toBeNull();
        expect(mod.connection.connected).toBe(false);
    });

    it('disconnect without a socket does nothing', () => {
        expect(() => mod.disconnect()).not.toThrow();
    });

    it('logs connection errors', () => {
        mod.connect();
        fake.serverEmit('connect_error', new Error('refused'));
        expect(console.warn).toHaveBeenCalledWith('connect_error: refused');
    });
});

describe('registerUsername', () => {
    it('fails when not connected', async () => {
        expect(await mod.registerUsername('alice')).toBe('Not connected to the server.');
        mod.connect();
        expect(await mod.registerUsername('alice')).toBe('Not connected to the server.');
    });

    it('stores the name when the server accepts it', async () => {
        mod.connect();
        fake.connectNow();
        expect(await mod.registerUsername('alice')).toBe('');
        expect(fake.socket.emitWithAck).toHaveBeenCalledWith('playername', 'alice');
        expect(mod.player.name).toBe('alice');
    });

    it('returns the server error', async () => {
        mod.connect();
        fake.connectNow();
        fake.ackWith('playername', () => 'Invalid name');
        expect(await mod.registerUsername('alice')).toBe('Invalid name');
        expect(mod.player.name).toBe('');
    });

    it('handles a timeout', async () => {
        mod.connect();
        fake.connectNow();
        fake.ackWith('playername', () => Promise.reject(new Error('timeout')));
        expect(await mod.registerUsername('alice')).toBe('The server did not answer. Please try again.');
    });

    it('re-registers the name after a reconnection', async () => {
        mod.connect();
        fake.connectNow();
        await mod.registerUsername('alice');
        fake.socket.emitWithAck.mockClear();
        fake.connectNow();
        await vi.waitFor(() => expect(fake.socket.emitWithAck).toHaveBeenCalledWith('playername', 'alice'));
    });

    it('forgets the name if the server refuses it on reconnection', async () => {
        mod.connect();
        fake.connectNow();
        await mod.registerUsername('alice');
        fake.ackWith('playername', () => 'taken');
        fake.connectNow();
        await vi.waitFor(() => expect(mod.player.name).toBe(''));
    });

    it('resetUsername clears the name', async () => {
        mod.connect();
        fake.connectNow();
        await mod.registerUsername('alice');
        mod.resetUsername();
        expect(mod.player.name).toBe('');
    });
});

describe('rooms', () => {
    beforeEach(() => {
        mod.connect();
        fake.connectNow();
    });

    it('stores the room list', () => {
        fake.serverEmit('rooms', [STATUS]);
        expect(mod.lobby.rooms).toEqual([STATUS]);
    });

    it('joinRoom sets the room on success', async () => {
        expect(await mod.joinRoom('lobby')).toBe('');
        expect(fake.socket.emitWithAck).toHaveBeenCalledWith('join', 'lobby');
        expect(mod.room.id).toBe('lobby');
    });

    it('joinRoom resets the room on error', async () => {
        fake.ackWith('join', () => 'Room full');
        expect(await mod.joinRoom('lobby')).toBe('Room full');
        expect(mod.room.id).toBe('');
    });

    it('joinRoom handles a timeout', async () => {
        fake.ackWith('join', () => Promise.reject(new Error('timeout')));
        expect(await mod.joinRoom('lobby')).toBe('The server did not answer. Please try again.');
        expect(mod.room.id).toBe('');
    });

    it('joinRoom fails when not connected', async () => {
        fake.socket.connected = false;
        expect(await mod.joinRoom('lobby')).toBe('Not connected to the server.');
    });

    it('only keeps the status of the current room', async () => {
        await mod.joinRoom('lobby');
        fake.serverEmit('roomstatus', { ...STATUS, id: 'other' });
        expect(mod.room.status).toBeNull();
        fake.serverEmit('roomstatus', STATUS);
        expect(mod.room.status).toEqual(STATUS);
    });

    it('leaveRoom emits leave and resets the state', async () => {
        await mod.joinRoom('lobby');
        fake.serverEmit('roomstatus', STATUS);
        mod.leaveRoom();
        expect(fake.socket.emit).toHaveBeenCalledWith('leave');
        expect(mod.room).toEqual({ id: '', status: null });
    });

    it('leaveRoom does nothing outside a room', () => {
        mod.leaveRoom();
        expect(fake.socket.emit).not.toHaveBeenCalled();
    });

    it('a disconnection resets the room', async () => {
        await mod.joinRoom('lobby');
        fake.serverEmit('disconnect');
        expect(mod.room.id).toBe('');
    });
});

describe('game', () => {
    beforeEach(async () => {
        mod.connect();
        fake.connectNow();
        await mod.joinRoom('lobby');
    });

    it('startGame and sendKey emit to the server', () => {
        mod.startGame();
        mod.sendKey('keydown', 'ArrowLeft');
        mod.sendKey('keyup', 'ArrowLeft');
        expect(fake.socket.emit).toHaveBeenCalledWith('start');
        expect(fake.socket.emit).toHaveBeenCalledWith('keydown', 'ArrowLeft');
        expect(fake.socket.emit).toHaveBeenCalledWith('keyup', 'ArrowLeft');
    });

    it('gamestarting resets the previous round and detects solo games', () => {
        fake.serverEmit('roomstatus', { ...STATUS, players: ['alice'] });
        fake.serverEmit('playerlost', { name: 'alice' });
        fake.serverEmit('gameend', { winner: null });
        fake.serverEmit('gamestarting');
        expect(mod.game).toMatchObject({ solo: true, lost: [], result: null, state: null });

        fake.serverEmit('roomstatus', STATUS);
        fake.serverEmit('gamestarting');
        expect(mod.game.solo).toBe(false);
    });

    it('gamestarting without a room status is not solo', () => {
        fake.serverEmit('gamestarting');
        expect(mod.game.solo).toBe(false);
    });

    it('stores the last gamestatus', () => {
        const state = { time: 1, board: [], piece: null, lost: false, opponents: [] };
        fake.serverEmit('gamestatus', state);
        expect(mod.game.state).toEqual(state);
    });

    it('records each lost player once', () => {
        fake.serverEmit('playerlost', { name: 'bob' });
        fake.serverEmit('playerlost', { name: 'bob' });
        fake.serverEmit('playerlost', { name: null });
        expect(mod.game.lost).toEqual(['bob']);
    });

    it('stores the winner', () => {
        fake.serverEmit('gameend', { winner: 'alice' });
        expect(mod.game.result).toEqual({ winner: 'alice' });
    });
});

describe('without a socket', () => {
    it('emitters are no-ops', () => {
        expect(() => {
            mod.startGame();
            mod.sendKey('keydown', ' ');
        }).not.toThrow();
    });
});
