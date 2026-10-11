import { io, type Socket } from 'socket.io-client';
import type { Rgb, ServerPiece } from './board';

export type RoomStatus = {
    id: string;
    host: string | undefined;
    players: (string | undefined)[];
    maxPlayers: number;
    gameOngoing: boolean;
};

export type OpponentStatus = {
    name: string;
    spectrum: number[];
    alive: boolean;
};

// `gamestatus`: the player's own board, piece and next piece, and only the spectrum of each opponent.
export type GameStatus = {
    time: number;
    board: Rgb[];
    piece: ServerPiece;
    nextPiece: string | null;
    lost: boolean;
    opponents: OpponentStatus[];
};

let socket: Socket | null = null;

export const connection = $state({ connected: false, id: '' });
export const player = $state({ name: '' });
export const lobby = $state({ rooms: [] as RoomStatus[] });
export const room = $state({ id: '', status: null as RoomStatus | null });
export const game = $state({
    solo: false,
    lost: [] as string[],
    result: null as { winner: string | null } | null,
    state: null as GameStatus | null,
});

export function getSocket(): Socket | null {
    return socket;
}

export function connect(): Socket {
    if (socket) {
        console.log('This client already possesses a socket.');
        return socket;
    }
    const s: Socket = io();

    s.on('connect', () => {
        connection.connected = true;
        connection.id = s.id ?? '';
        if (player.name) {
            registerUsername(player.name).then(error => {
                if (error) player.name = '';
            });
        }
    });

    s.on('disconnect', () => {
        connection.connected = false;
        connection.id = '';
        resetRoom();
    });

    s.on('rooms', (rooms: RoomStatus[]) => {
        lobby.rooms = rooms;
    });

    s.on('roomstatus', (status: RoomStatus) => {
        if (status.id !== room.id) return;
        room.status = status;
    });

    s.on('gamestarting', () => {
        game.solo = room.status?.players.length === 1;
        game.lost = [];
        game.result = null;
        game.state = null;
    });

    s.on('gamestatus', (state: GameStatus) => {
        game.state = state;
    });

    s.on('playerlost', ({ name }: { name: string | null }) => {
        if (name && !game.lost.includes(name)) game.lost = [...game.lost, name];
    });

    s.on('gameend', ({ winner }: { winner: string | null }) => {
        game.result = { winner };
    });

    s.on('connect_error', (err) => console.warn(`connect_error: ${err.message}`));

    socket = s;
    return socket;
}

export async function registerUsername(name: string): Promise<string> {
    if (!socket || !socket.connected) return 'Not connected to the server.';
    try {
        const error: string = await socket.timeout(5000).emitWithAck('playername', name);
        if (error) return error;
    } catch {
        return 'The server did not answer. Please try again.';
    }
    player.name = name;
    return '';
}

export function resetUsername(): void {
    player.name = '';
}

export async function joinRoom(roomId: string): Promise<string> {
    if (!socket || !socket.connected) return 'Not connected to the server.';
    room.id = roomId;
    let error: string;
    try {
        error = await socket.timeout(5000).emitWithAck('join', roomId);
    } catch {
        error = 'The server did not answer. Please try again.';
    }
    if (error) resetRoom();
    return error;
}

export function sendKey(type: 'keydown' | 'keyup', key: string): void {
    socket?.emit(type, key);
}

export function startGame(): void {
    socket?.emit('start');
}

export function leaveRoom(): void {
    if (!room.id) return;
    socket?.emit('leave');
    resetRoom();
}

function resetRoom(): void {
    room.id = '';
    room.status = null;
    game.lost = [];
    game.result = null;
    game.state = null;
}

export function disconnect(): void {
    if (!socket) return;
    console.log(`Disconnecting socket: ${socket.id}`);
    socket.disconnect();
    socket = null;
    connection.connected = false;
    connection.id = '';
}
