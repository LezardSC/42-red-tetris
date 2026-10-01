import { afterEach, describe, expect, it } from 'vitest';
import { goto, matchRoute, route } from '../src/lib/router.svelte';

describe('matchRoute', () => {
    it('matches the root path', () => {
        expect(matchRoute('/', '/')).toEqual({});
        expect(matchRoute('/', '')).toEqual({});
        expect(matchRoute('/', '/room')).toBeNull();
    });

    it('extracts params', () => {
        expect(matchRoute('/:room/:username', '/lobby/alice')).toEqual({ room: 'lobby', username: 'alice' });
        expect(matchRoute('/:room/:username', '/lobby/alice/')).toEqual({ room: 'lobby', username: 'alice' });
    });

    it('decodes URI components', () => {
        expect(matchRoute('/:room/:username', '/my%20room/al%C3%AFce')).toEqual({ room: 'my room', username: 'alïce' });
    });

    it('fails on a malformed URI component', () => {
        expect(matchRoute('/:room/:username', '/%E0%A4%A/alice')).toBeNull();
    });

    it('fails when the number of segments differs', () => {
        expect(matchRoute('/:room/:username', '/lobby')).toBeNull();
        expect(matchRoute('/:room/:username', '/a/b/c')).toBeNull();
    });

    it('compares static segments', () => {
        expect(matchRoute('/debug/:id', '/debug/3')).toEqual({ id: '3' });
        expect(matchRoute('/debug/:id', '/other/3')).toBeNull();
        expect(matchRoute('/a/:id/b', '/x/3/b')).toBeNull();
    });
});

describe('goto', () => {
    afterEach(() => goto('/', true));

    it('pushes a new history entry and updates the route', () => {
        const length = window.history.length;
        goto('/room/alice');
        expect(route.path).toBe('/room/alice');
        expect(window.location.pathname).toBe('/room/alice');
        expect(window.history.length).toBe(length + 1);
    });

    it('replaces the current entry when asked', () => {
        const length = window.history.length;
        goto('/room/bob', true);
        expect(window.location.pathname).toBe('/room/bob');
        expect(window.history.length).toBe(length);
    });

    it('does nothing when already on that path', () => {
        goto('/same', true);
        const length = window.history.length;
        goto('/same');
        expect(window.history.length).toBe(length);
    });

    it('follows the browser back/forward buttons', () => {
        window.history.pushState(null, '', '/elsewhere/x');
        window.dispatchEvent(new PopStateEvent('popstate'));
        expect(route.path).toBe('/elsewhere/x');
    });
});
