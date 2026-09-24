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

export function getSocket(): Socket | null {
    return socket;
}

export function connect(): Socket {
    if (socket) {
        console.log('This client already possesses a socket.');
        return socket;
    }
    socket = io();
    return socket;
}

export function disconnect(): void {
    if (!socket) return;
    console.log(`Disconnecting socket: ${socket.id}`);
    socket.disconnect();
    socket = null;
}
