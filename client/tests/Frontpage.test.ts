import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import Frontpage from '../src/Frontpage.svelte';
import { lobby, registerUsername } from '../src/lib/socket.svelte';
import { route } from '../src/lib/router.svelte';
import { createFakeSocket, type FakeSocket } from './fakeSocket';
import { STATUS, closeSession, openSession } from './session';

const ctx = vi.hoisted(() => ({ fake: null as unknown as FakeSocket }));
vi.mock('socket.io-client', () => ({ io: () => ctx.fake.socket }));

beforeEach(() => {
    ctx.fake = createFakeSocket();
    openSession(ctx.fake);
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    closeSession(ctx.fake);
    vi.restoreAllMocks();
});

const setRooms = (rooms: typeof STATUS[]) => {
    lobby.rooms = rooms;
    flushSync();
};

describe('Frontpage: username', () => {
    it('validates the username before sending it', async () => {
        const user = userEvent.setup();
        render(Frontpage);
        await user.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(screen.getByText('Username cannot be empty.')).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText('Enter Username'), 'bad name');
        expect(screen.queryByText('Username cannot be empty.')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(screen.getByText(/can only contain letters/)).toBeInTheDocument();
        expect(ctx.fake.socket.emitWithAck).not.toHaveBeenCalled();
    });

    it('registers the username and shows it', async () => {
        const user = userEvent.setup();
        render(Frontpage);
        await user.type(screen.getByPlaceholderText('Enter Username'), 'alice');
        await user.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(ctx.fake.socket.emitWithAck).toHaveBeenCalledWith('playername', 'alice');
        expect(await screen.findByText('alice')).toBeInTheDocument();
        expect(screen.getByText(/Playing as/)).toBeInTheDocument();
    });

    it('shows the server error', async () => {
        ctx.fake.ackWith('playername', () => 'Name refused by the server.');
        const user = userEvent.setup();
        render(Frontpage);
        await user.type(screen.getByPlaceholderText('Enter Username'), 'alice');
        await user.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(await screen.findByText('Name refused by the server.')).toBeInTheDocument();
    });

    it('lets the player change their name', async () => {
        await registerUsername('alice');
        const user = userEvent.setup();
        render(Frontpage);
        await user.click(screen.getByRole('button', { name: 'Change' }));
        expect(screen.getByPlaceholderText('Enter Username')).toBeInTheDocument();
    });
});

describe('Frontpage: rooms', () => {
    it('shows a message when there is no room', () => {
        render(Frontpage);
        expect(screen.getByText('No available rooms at the moment.')).toBeInTheDocument();
        expect(screen.getByText(/Choose a username first/)).toBeInTheDocument();
    });

    it('lists only the joinable rooms, newest first', () => {
        render(Frontpage);
        setRooms([
            { ...STATUS, id: 'old' },
            { ...STATUS, id: 'full', players: ['a', 'b', 'c', 'd'] },
            { ...STATUS, id: 'playing', gameOngoing: true },
            { ...STATUS, id: 'new' },
        ]);
        const items = screen.getAllByRole('listitem').map(item => item.textContent);
        expect(items).toHaveLength(2);
        expect(items[0]).toContain('new');
        expect(items[1]).toContain('old');
        expect(items[0]).toContain('Players: 2/4');
    });

    it('scrolls when there are many rooms', () => {
        const { container } = render(Frontpage);
        setRooms(['a', 'b', 'c', 'd'].map(id => ({ ...STATUS, id })));
        expect(container.querySelector('.room-list-scroll')).not.toBeNull();
    });

    it('disables joining without a username', () => {
        render(Frontpage);
        setRooms([STATUS]);
        expect(screen.getByRole('button', { name: 'Join' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Create & Join' })).toBeDisabled();
    });

    it('joins a room by navigating to its URL', async () => {
        await registerUsername('alice');
        const user = userEvent.setup();
        render(Frontpage);
        setRooms([STATUS]);
        await user.click(screen.getByRole('button', { name: 'Join' }));
        expect(route.path).toBe('/lobby/alice');
    });

    it('validates the new room name', async () => {
        await registerUsername('alice');
        const user = userEvent.setup();
        render(Frontpage);
        await user.click(screen.getByRole('button', { name: 'Create & Join' }));
        expect(screen.getByText('Room name cannot be empty.')).toBeInTheDocument();
        await user.type(screen.getByPlaceholderText('New room name'), 'x');
        expect(screen.queryByText('Room name cannot be empty.')).not.toBeInTheDocument();
        expect(route.path).toBe('/');
    });

    it('creates a room by navigating to its URL', async () => {
        await registerUsername('alice');
        const user = userEvent.setup();
        render(Frontpage);
        await user.type(screen.getByPlaceholderText('New room name'), 'my_room');
        await user.click(screen.getByRole('button', { name: 'Create & Join' }));
        expect(route.path).toBe('/my_room/alice');
    });
});
