import { vi } from 'vitest';

type Handler = (...args: any[]) => void;

export function createFakeSocket() {
    const handlers = new Map<string, Handler[]>();
    const acks = new Map<string, (...args: any[]) => unknown>();

    const socket = {
        id: 'socket-1',
        connected: false,
        on: vi.fn((event: string, handler: Handler) => {
            handlers.set(event, [...(handlers.get(event) ?? []), handler]);
            return socket;
        }),
        emit: vi.fn(),
        emitWithAck: vi.fn(async (event: string, ...args: unknown[]) => {
            const answer = acks.get(event);
            return answer ? answer(...args) : '';
        }),
        timeout: vi.fn(() => socket),
        disconnect: vi.fn(() => {
            socket.connected = false;
        }),
    };

    function serverEmit(event: string, ...args: unknown[]): void {
        (handlers.get(event) ?? []).forEach(handler => handler(...args));
    }

    function ackWith(event: string, answer: (...args: any[]) => unknown): void {
        acks.set(event, answer);
    }

    function connectNow(): void {
        socket.connected = true;
        serverEmit('connect');
    }

    return { socket, serverEmit, ackWith, connectNow };
}

export type FakeSocket = ReturnType<typeof createFakeSocket>;
