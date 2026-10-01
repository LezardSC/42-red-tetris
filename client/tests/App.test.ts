import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import App from '../src/App.svelte';
import { getSocket } from '../src/lib/socket.svelte';
import { goto, route } from '../src/lib/router.svelte';
import { createFakeSocket, type FakeSocket } from './fakeSocket';

const ctx = vi.hoisted(() => ({ fake: null as unknown as FakeSocket }));
vi.mock('socket.io-client', () => ({ io: () => ctx.fake.socket }));

beforeEach(() => {
    ctx.fake = createFakeSocket();
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    goto('/', true);
    vi.restoreAllMocks();
});

describe('App', () => {
    it('connects on mount and disconnects on destroy', () => {
        const { unmount } = render(App);
        expect(getSocket()).toBe(ctx.fake.socket);
        unmount();
        expect(ctx.fake.socket.disconnect).toHaveBeenCalled();
        expect(getSocket()).toBeNull();
    });

    it('shows the front page on /', () => {
        const { unmount } = render(App);
        expect(screen.getByText('Player Profile')).toBeInTheDocument();
        unmount();
    });

    it('shows the room on /:room/:username', () => {
        goto('/lobby/alice', true);
        const { unmount } = render(App);
        expect(screen.getByText(/Joining/)).toBeInTheDocument();
        unmount();
    });

    it('sends unknown URLs back to /', () => {
        goto('/some/unknown/path', true);
        const { unmount } = render(App);
        expect(route.path).toBe('/');
        expect(window.location.pathname).toBe('/');
        unmount();
    });
});
