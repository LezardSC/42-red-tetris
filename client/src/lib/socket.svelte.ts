import { io, type Socket } from 'socket.io-client';

type Rgb = [number, number, number];
type Coordinates = { x: number; y: number };

// Shape of the server's `rooms` (array) and `roomstatus` events. Players and host are names.
export type RoomStatus = {
    id: string;
    host: string | undefined;
    players: (string | undefined)[];
    maxPlayers: number;
    gameOngoing: boolean;
};

export type PlayerState = {
    playerId: string;
    board: Rgb[];
    piece: {
        center: Coordinates;
        tiles: Coordinates[];
        color: Rgb;
    };
};

export type GameStatus = {
    time: number;
    players: [string, PlayerState][];
};

let socket: Socket | null = null;

export const connection = $state({ connected: false, id: '' });
export const player = $state({ name: '' });
export const lobby = $state({ rooms: [] as RoomStatus[] });
export const room = $state({ id: '', status: null as RoomStatus | null });

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

export function leaveRoom(): void {
    if (!room.id) return;
    socket?.emit('leave');
    resetRoom();
}

function resetRoom(): void {
    room.id = '';
    room.status = null;
}

export function disconnect(): void {
    if (!socket) return;
    console.log(`Disconnecting socket: ${socket.id}`);
    socket.disconnect();
    socket = null;
    connection.connected = false;
    connection.id = '';
}
