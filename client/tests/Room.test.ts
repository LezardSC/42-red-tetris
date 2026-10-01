import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import Room from '../src/Room.svelte';
import { game, player, registerUsername, room } from '../src/lib/socket.svelte';
import { goto, route } from '../src/lib/router.svelte';
import { createFakeSocket, type FakeSocket } from './fakeSocket';
import { STATUS, closeSession, openSession } from './session';

const ctx = vi.hoisted(() => ({ fake: null as unknown as FakeSocket }));
vi.mock('socket.io-client', () => ({ io: () => ctx.fake.socket }));

beforeEach(() => {
    ctx.fake = createFakeSocket();
    openSession(ctx.fake);
    goto('/lobby/alice', true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    closeSession(ctx.fake);
    vi.restoreAllMocks();
});

const serverEmit = (event: string, ...args: unknown[]) => {
    ctx.fake.serverEmit(event, ...args);
    flushSync();
};

async function renderJoined(username = 'alice', status = STATUS) {
    const result = render(Room, { room: 'lobby', username });
    await vi.waitFor(() => expect(room.id).toBe('lobby'));
    serverEmit('roomstatus', status);
    return result;
}

describe('Room: joining', () => {
    it('registers the URL name, then joins', async () => {
        render(Room, { room: 'lobby', username: 'alice' });
        expect(screen.getByText(/Joining/)).toBeInTheDocument();
        await vi.waitFor(() => expect(ctx.fake.socket.emitWithAck).toHaveBeenCalledWith('join', 'lobby'));
        expect(ctx.fake.socket.emitWithAck).toHaveBeenCalledWith('playername', 'alice');
        expect(player.name).toBe('alice');
    });

    it('does not register again a name that is already set', async () => {
        await registerUsername('alice');
        ctx.fake.socket.emitWithAck.mockClear();
        render(Room, { room: 'lobby', username: 'alice' });
        await vi.waitFor(() => expect(ctx.fake.socket.emitWithAck).toHaveBeenCalledWith('join', 'lobby'));
        expect(ctx.fake.socket.emitWithAck).not.toHaveBeenCalledWith('playername', 'alice');
    });

    it('refuses invalid URL params', () => {
        render(Room, { room: 'bad room', username: 'alice' });
        expect(screen.getByText('Cannot join room')).toBeInTheDocument();
        expect(screen.getByText(/Room name can only contain/)).toBeInTheDocument();
        expect(ctx.fake.socket.emitWithAck).not.toHaveBeenCalled();
    });

    it('shows a refused name', async () => {
        ctx.fake.ackWith('playername', () => 'Invalid username.');
        render(Room, { room: 'lobby', username: 'alice' });
        expect(await screen.findByText('Invalid username.')).toBeInTheDocument();
        expect(ctx.fake.socket.emitWithAck).not.toHaveBeenCalledWith('join', 'lobby');
    });

    it('shows a refused join and goes back home', async () => {
        ctx.fake.ackWith('join', () => 'The room is full.');
        const user = userEvent.setup();
        render(Room, { room: 'lobby', username: 'alice' });
        expect(await screen.findByText('The room is full.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Back to home' }));
        expect(route.path).toBe('/');
    });

    it('leaves the room when destroyed', async () => {
        const { unmount } = await renderJoined();
        unmount();
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('leave');
        expect(room.id).toBe('');
    });
});

describe('Room: lobby', () => {
    it('shows the players, the host and the empty slots', async () => {
        await renderJoined();
        expect(screen.getByText('lobby')).toBeInTheDocument();
        expect(screen.getByText('2/4 players')).toBeInTheDocument();
        expect(screen.getByText('(you)')).toBeInTheDocument();
        expect(screen.getByText('Host')).toBeInTheDocument();
        expect(screen.getAllByText('Waiting for player…')).toHaveLength(2);
    });

    it('ignores undefined player slots', async () => {
        await renderJoined('alice', { ...STATUS, host: undefined as unknown as string, players: ['alice', undefined as unknown as string] });
        expect(screen.getByText('1/4 players')).toBeInTheDocument();
    });

    it('lets the host start the game', async () => {
        const user = userEvent.setup();
        await renderJoined('alice');
        expect(screen.getByText(/You are the host/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Start game' }));
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('start');
    });

    it('makes other players wait for the host', async () => {
        await renderJoined('bob');
        expect(screen.queryByRole('button', { name: 'Start game' })).not.toBeInTheDocument();
        expect(screen.getByText(/to start the game/)).toHaveTextContent('Waiting for alice to start the game');
    });

    it('leaves the room with the Leave button', async () => {
        const user = userEvent.setup();
        await renderJoined('bob');
        await user.click(screen.getByRole('button', { name: 'Leave' }));
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('leave');
        expect(route.path).toBe('/');
    });
});

describe('Room: game', () => {
    it('shows the game while it is running', async () => {
        await renderJoined();
        serverEmit('gamestarting');
        serverEmit('roomstatus', { ...STATUS, gameOngoing: true });
        expect(screen.getByText('Opponents')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows the defeat overlay to a knocked-out player', async () => {
        const user = userEvent.setup();
        await renderJoined();
        serverEmit('roomstatus', { ...STATUS, gameOngoing: true });
        serverEmit('playerlost', { name: 'alice' });
        expect(screen.getByRole('dialog')).toHaveTextContent('Defeat');
        await user.click(screen.getAllByRole('button', { name: 'Leave' }).at(-1)!);
        expect(route.path).toBe('/');
    });

    const endRound = async (username: string, winner: string | null, players = STATUS.players) => {
        await renderJoined(username, { ...STATUS, players });
        serverEmit('gamestarting');
        serverEmit('roomstatus', { ...STATUS, players, gameOngoing: true });
        serverEmit('gameend', { winner });
        serverEmit('roomstatus', { ...STATUS, players });
    };

    it('announces a victory', async () => {
        await endRound('alice', 'alice');
        expect(screen.getByText('Victory!')).toBeInTheDocument();
        expect(screen.getByText('You were the last one standing.')).toBeInTheDocument();
    });

    it('announces a defeat with the winner', async () => {
        await endRound('bob', 'alice');
        expect(screen.getByText('Defeat')).toBeInTheDocument();
        expect(screen.getByText(/won the last round/)).toHaveTextContent('alice won the last round.');
    });

    it('announces a round without survivors', async () => {
        await endRound('bob', null);
        expect(screen.getByText('Nobody survived the last round.')).toBeInTheDocument();
    });

    it('announces the end of a solo game', async () => {
        await endRound('alice', null, ['alice']);
        expect(game.solo).toBe(true);
        expect(screen.getByText('Game over')).toBeInTheDocument();
        expect(screen.getByText('The stack reached the top.')).toBeInTheDocument();
    });
});
