import { io, type Socket } from 'socket.io-client';

type Rgb = [number, number, number];
type Coordinates = { x: number; y: number };

export type RoomStatus = {
    name: string;
    host: string | undefined;
    players: string[];
    maxPlayers: number;
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

export function disconnect(): void {
    if (!socket) return;
    console.log(`Disconnecting socket: ${socket.id}`);
    socket.disconnect();
    socket = null;
    connection.connected = false;
    connection.id = '';
}
