import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import Game from '../src/Game.svelte';
import { COLS, ROWS, type Rgb } from '../src/lib/board';
import { createFakeSocket, type FakeSocket } from './fakeSocket';
import { closeSession, openSession } from './session';

const ctx = vi.hoisted(() => ({ fake: null as unknown as FakeSocket }));
vi.mock('socket.io-client', () => ({ io: () => ctx.fake.socket }));

const WHITE: Rgb = [255, 255, 255];
const GREY: Rgb = [128, 128, 128];
const YELLOW: Rgb = [254, 251, 52];

const PLAYERS = [
    { name: 'alice', alive: true },
    { name: 'bob', alive: true },
    { name: 'carol', alive: false },
];

function gameStatus(lost = false, nextPiece: string | null = 'T') {
    const board: Rgb[] = Array.from({ length: ROWS * COLS }, (_, i) => (i >= (ROWS - 1) * COLS ? GREY : WHITE));
    return {
        time: 0,
        board,
        piece: { center: { x: 4, y: 0 }, tiles: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], color: YELLOW },
        nextPiece,
        lost,
        opponents: [{ name: 'bob', spectrum: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0], alive: true }],
    };
}

beforeEach(() => {
    ctx.fake = createFakeSocket();
    openSession(ctx.fake);
    vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    closeSession(ctx.fake);
    vi.restoreAllMocks();
});

const renderGame = (players = PLAYERS, onLeave = vi.fn()) => render(Game, { username: 'alice', players, onLeave });

const ownBlocks = (container: HTMLElement) => container.querySelectorAll('.own-board .tetris-block');

describe('Game: boards', () => {
    it('draws an empty board before the first gamestatus', () => {
        const { container } = renderGame();
        expect(container.querySelectorAll('.own-board .cell')).toHaveLength(200);
        expect(ownBlocks(container)).toHaveLength(0);
    });

    it('draws the board and the falling piece', () => {
        const { container } = renderGame();
        ctx.fake.serverEmit('gamestatus', gameStatus());
        flushSync();
        expect(ownBlocks(container)).toHaveLength(10 + 4);
    });

    it('hides the piece once the player lost', () => {
        const { container } = renderGame();
        ctx.fake.serverEmit('gamestatus', gameStatus(true));
        flushSync();
        expect(ownBlocks(container)).toHaveLength(10);
    });

    it('draws the opponents spectrums and KO badges', () => {
        const { container } = renderGame();
        ctx.fake.serverEmit('gamestatus', gameStatus());
        flushSync();
        expect(screen.getByText('bob')).toBeInTheDocument();
        expect(screen.getByText('carol')).toBeInTheDocument();
        const boards = container.querySelectorAll('.mini-board');
        expect(boards).toHaveLength(2);
        expect(boards[0].querySelectorAll('.spectrum')).toHaveLength(3);
        expect(boards[1].querySelectorAll('.spectrum')).toHaveLength(0);
        expect(boards[1]).toHaveClass('knocked-out');
        expect(screen.getAllByText('KO')).toHaveLength(1);
    });

    it('shows a solo message without opponents', () => {
        renderGame([{ name: 'alice', alive: true }]);
        expect(screen.getByText(/Solo game/)).toBeInTheDocument();
    });

    it('calls onLeave', async () => {
        const onLeave = vi.fn();
        const user = userEvent.setup();
        renderGame(PLAYERS, onLeave);
        await user.click(screen.getByRole('button', { name: 'Leave' }));
        expect(onLeave).toHaveBeenCalled();
    });
});

describe('Game: next piece', () => {
    const nextBlocks = (container: HTMLElement) => container.querySelectorAll('.next-board .tetris-block');

    it('shows nothing before the first gamestatus', () => {
        const { container } = renderGame();
        expect(container.querySelector('.next-board')).toBeNull();
    });

    it('shows the next piece', () => {
        const { container } = renderGame();
        ctx.fake.serverEmit('gamestatus', gameStatus(false, 'T'));
        flushSync();
        expect(nextBlocks(container)).toHaveLength(4);
        expect(container.querySelectorAll('.next-board .cell')).toHaveLength(6);
    });

    it('hides the next piece once the player lost', () => {
        const { container } = renderGame();
        ctx.fake.serverEmit('gamestatus', gameStatus(true, 'T'));
        flushSync();
        expect(container.querySelector('.next-board')).toBeNull();
    });
});

describe('Game: keyboard', () => {
    it('sends game keys to the server and prevents the default action', () => {
        renderGame();
        const down = new KeyboardEvent('keydown', { key: 'ArrowLeft', code: 'ArrowLeft', cancelable: true });
        window.dispatchEvent(down);
        expect(down.defaultPrevented).toBe(true);
        fireEvent.keyUp(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
        fireEvent.keyDown(window, { key: ' ', code: 'Space' });
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('keydown', 'ArrowLeft');
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('keyup', 'ArrowLeft');
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('keydown', ' ');
    });

    it('maps WASD to the arrow keys by physical position (ZQSD on AZERTY)', () => {
        renderGame();
        const down = new KeyboardEvent('keydown', { key: 'z', code: 'KeyW', cancelable: true });
        window.dispatchEvent(down);
        expect(down.defaultPrevented).toBe(true);
        fireEvent.keyDown(window, { key: 'q', code: 'KeyA' });
        fireEvent.keyDown(window, { key: 's', code: 'KeyS' });
        fireEvent.keyUp(window, { key: 'd', code: 'KeyD' });
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('keydown', 'ArrowUp');
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('keydown', 'ArrowLeft');
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('keydown', 'ArrowDown');
        expect(ctx.fake.socket.emit).toHaveBeenCalledWith('keyup', 'ArrowRight');
    });

    it('ignores other keys', () => {
        renderGame();
        const down = new KeyboardEvent('keydown', { key: 'e', code: 'KeyE', cancelable: true });
        window.dispatchEvent(down);
        fireEvent.keyUp(window, { key: 'e', code: 'KeyE' });
        expect(down.defaultPrevented).toBe(false);
        expect(ctx.fake.socket.emit).not.toHaveBeenCalled();
    });

    it('ignores the browser auto-repeat', () => {
        renderGame();
        fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown', repeat: true });
        expect(ctx.fake.socket.emit).not.toHaveBeenCalled();
    });

    it('does not send key presses once knocked out', () => {
        renderGame([{ name: 'alice', alive: false }]);
        fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
        expect(ctx.fake.socket.emit).not.toHaveBeenCalled();
    });

    it('does not send key presses for a player missing from the list', () => {
        renderGame([{ name: 'bob', alive: true }]);
        fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
        expect(ctx.fake.socket.emit).not.toHaveBeenCalled();
    });

    it('releases every key once when the window loses focus', () => {
        renderGame();
        fireEvent.blur(window);
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].forEach(key =>
            expect(ctx.fake.socket.emit).toHaveBeenCalledWith('keyup', key),
        );
        expect(ctx.fake.socket.emit).toHaveBeenCalledTimes(5);
    });
});
