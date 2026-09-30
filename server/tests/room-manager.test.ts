import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoomManager from "../src/back/room-manager.ts";
import UserManager from "../src/back/user-manager.ts";
import type { RoomStatus } from "../src/back/room.ts";

const roomInstances: any[] = [];

vi.mock("../src/back/room.ts", () => {
    class MockRoom {
        userManager: any;
        host: string;
        id: string;
        players: string[] = [];
        start = vi.fn();
        end = vi.fn();
        addPlayer = vi.fn((playerId: string) => {
            this.players.push(playerId);
        });
        removePlayer = vi.fn((playerId: string) => {
            const index = this.players.indexOf(playerId);

            if (index !== -1) {
                this.players.splice(index, 1);
            }
        });
        hasPlayerNamed = vi.fn((name: string) =>
            this.players.some(id => this.userManager.getUserName(id) === name),
        );
        getStatus = vi.fn((): RoomStatus => ({
            id: this.id,
            host: this.host,
            players: this.players,
            maxPlayers: 4,
            gameOngoing: false,
        }));

        constructor(
            userManager: any,
            host: string,
            roomId: string,
        ) {
            this.userManager = userManager;
            this.host = host;
            this.id = roomId;
            this.players.push(host);
            roomInstances.push(this);
        }
    }

    return {
        default: MockRoom,
    };
});

describe("RoomManager", () => {
    let server: any;
    let gameManager: any;
    let userManager: UserManager;
    let manager: RoomManager;

    beforeEach(() => {
        vi.clearAllMocks();
        roomInstances.length = 0;

        server = {
            log: {
                info: vi.fn(),
            },
            socketIO: {
                emit: vi.fn(),
            },
        };

        gameManager = {
            gameManagerEmitter: new EventEmitter(),
        };

        userManager = new UserManager();

        manager = new RoomManager(
            server,
            gameManager,
            userManager,
        );
    });

    describe("constructor", () => {
        it("should initialize with the provided server", () => {
            expect(manager.server).toBe(server);
        });

        it("should initialize with the provided user manager", () => {
            expect(manager.userManager).toBe(userManager);
        });

        it("should initialize with no rooms", () => {
            expect(manager.rooms).toEqual([]);
        });

        it("should register a gameend listener", () => {
            expect(
                gameManager.gameManagerEmitter.listenerCount(
                    "gameend",
                ),
            ).toBe(1);
        });
    });

    describe("create", () => {
        it("should create a room", () => {
            const result = manager.create(
                "player-1",
                "room-1",
            );

            expect(result).toBe(true);
            expect(manager.rooms).toHaveLength(1);

            const room = manager.rooms[0]?.[1];

            expect(room).toBeDefined();
            expect(room.host).toBe("player-1");
            expect(room.id).toBe("room-1");
        });

        it("should create the Room with the user manager", () => {
            manager.create("player-1", "room-1");

            const room = roomInstances[0];

            expect(room.userManager).toBe(userManager);
            expect(room.host).toBe("player-1");
            expect(room.id).toBe("room-1");
        });

        it("should log the creation", () => {
            manager.create("player-1", "room-1");

            expect(server.log.info).toHaveBeenCalledWith(
                "Created room room-1 with host player-1.",
            );
        });

        it("should emit the room list", () => {
            manager.create("player-1", "room-1");

            expect(server.socketIO.emit).toHaveBeenCalledWith(
                "rooms",
                manager.getAllRoomStatus(),
            );
        });

        it("should allow multiple rooms", () => {
            manager.create("player-1", "room-1");
            manager.create("player-2", "room-2");

            expect(manager.rooms).toHaveLength(2);
        });
    });

    describe("delete", () => {
        it("should delete an existing room", () => {
            manager.create("player-1", "room-1");

            const result = manager.delete("room-1");

            expect(result).toBe(true);
            expect(manager.rooms).toHaveLength(0);
        });

        it("should log successful deletion", () => {
            manager.create("player-1", "room-1");

            server.log.info.mockClear();

            manager.delete("room-1");

            expect(server.log.info).toHaveBeenCalledWith(
                "Deleted room room-1}.",
            );
        });

        it("should emit the room list after deletion", () => {
            manager.create("player-1", "room-1");

            server.socketIO.emit.mockClear();

            manager.delete("room-1");

            expect(server.socketIO.emit).toHaveBeenCalledWith(
                "rooms",
                [],
            );
        });

        it("should return false when the room does not exist", () => {
            const result = manager.delete("unknown-room");

            expect(result).toBe(false);
        });

        it("should log failed deletion", () => {
            manager.delete("unknown-room");

            expect(server.log.info).toHaveBeenCalledWith(
                "Failed to delete room unknown-room because it wasn't found.",
            );
        });

        it("should not emit when deletion fails", () => {
            manager.delete("unknown-room");

            expect(
                server.socketIO.emit,
            ).not.toHaveBeenCalled();
        });
    });

    describe("join", () => {
        it("should add a player to an existing room", () => {
            manager.create("host", "room-1");

            const result = manager.join(
                "player-1",
                "room-1",
            );

            expect(result).toBe(true);
            expect(manager.getRoomPlayers("room-1"))
                .toEqual(["host", "player-1"]);
        });

        it("should call addPlayer on the room", () => {
            manager.create("host", "room-1");

            const room = roomInstances[0];

            manager.join("player-1", "room-1");

            expect(room.addPlayer).toHaveBeenCalledWith(
                "player-1",
            );
        });

        it("should log a successful join", () => {
            manager.create("host", "room-1");

            server.log.info.mockClear();

            manager.join("player-1", "room-1");

            expect(server.log.info).toHaveBeenCalledWith(
                "player-1 joined room room-1.",
            );
        });

        it("should emit the room list after joining", () => {
            manager.create("host", "room-1");

            server.socketIO.emit.mockClear();

            manager.join("player-1", "room-1");

            expect(server.socketIO.emit).toHaveBeenCalledWith(
                "rooms",
                manager.getAllRoomStatus(),
            );
        });

        it("should return false when the room does not exist", () => {
            const result = manager.join(
                "player-1",
                "unknown-room",
            );

            expect(result).toBe(false);
        });

        it("should log a failed join", () => {
            manager.join(
                "player-1",
                "unknown-room",
            );

            expect(server.log.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Player player-1 failed to join room unknown-room",
                ),
            );
        });
    });

    describe("leave", () => {
        it("should remove a player from a room", () => {
            manager.create("host", "room-1");
            manager.join("player-1", "room-1");

            const result = manager.leave(
                "player-1",
                "room-1",
            );

            expect(result).toBe(true);
            expect(
                manager.getRoomPlayers("room-1"),
            ).toEqual(["host"]);
        });

        it("should call removePlayer on the room", () => {
            manager.create("host", "room-1");

            const room = roomInstances[0];

            manager.leave("host", "room-1");

            expect(room.removePlayer)
                .toHaveBeenCalledWith("host");
        });

        it("should delete the room when the last player leaves", () => {
            manager.create("host", "room-1");

            const result = manager.leave(
                "host",
                "room-1",
            );

            expect(result).toBe(true);
            expect(manager.roomExists("room-1"))
                .toBe(false);
        });

        it("should keep the room when other players remain", () => {
            manager.create("host", "room-1");
            manager.join("player-1", "room-1");

            manager.leave("player-1", "room-1");

            expect(manager.roomExists("room-1"))
                .toBe(true);
        });

        it("should return false when the room does not exist", () => {
            const result = manager.leave(
                "player-1",
                "unknown-room",
            );

            expect(result).toBe(false);
        });

        it("should log a successful leave", () => {
            manager.create("host", "room-1");
            manager.join("player-1", "room-1");

            server.log.info.mockClear();

            manager.leave("player-1", "room-1");

            expect(server.log.info).toHaveBeenCalledWith(
                "player-1 left room room-1.",
            );
        });

        it("should log a failed leave", () => {
            manager.leave(
                "player-1",
                "unknown-room",
            );

            expect(server.log.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Player player-1 failed to leave room unknown-room",
                ),
            );
        });
    });

    describe("start", () => {
        it("should start the game in a room", () => {
            manager.create("host", "room-1");

            const result = manager.start(
                "host",
                "room-1",
            );

            expect(result).toBe(true);

            const room = roomInstances[0];

            expect(room.start).toHaveBeenCalledWith(
                "host",
            );
        });

        it("should log a successful start", () => {
            manager.create("host", "room-1");

            server.log.info.mockClear();

            manager.start("host", "room-1");

            expect(server.log.info).toHaveBeenCalledWith(
                "host started game in room room-1.",
            );
        });

        it("should return false when the room does not exist", () => {
            const result = manager.start(
                "host",
                "unknown-room",
            );

            expect(result).toBe(false);
        });

        it("should return false when Room.start throws", () => {
            manager.create("host", "room-1");

            const room = roomInstances[0];

            room.start.mockImplementation(() => {
                throw new Error("Cannot start game");
            });

            const result = manager.start(
                "host",
                "room-1",
            );

            expect(result).toBe(false);
        });

        it("should log a failed start", () => {
            manager.start(
                "host",
                "unknown-room",
            );

            expect(server.log.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Player host failed to start game in room unknown-room",
                ),
            );
        });
    });

    describe("end", () => {
        it("should end the game in the room", () => {
            manager.create("host", "room-1");

            manager.end("room-1");

            const room = roomInstances[0];

            expect(room.end).toHaveBeenCalledOnce();
        });

        it("should emit the room list after ending", () => {
            manager.create("host", "room-1");

            server.socketIO.emit.mockClear();

            manager.end("room-1");

            expect(server.socketIO.emit).toHaveBeenCalledWith(
                "rooms",
                manager.getAllRoomStatus(),
            );
        });

        it("should handle a missing room", () => {
            expect(() => {
                manager.end("unknown-room");
            }).not.toThrow();

            expect(server.log.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Failed to end game in room unknown-room",
                ),
            );
        });

        it("should handle Room.end throwing", () => {
            manager.create("host", "room-1");

            const room = roomInstances[0];

            room.end.mockImplementation(() => {
                throw new Error("Cannot end game");
            });

            expect(() => {
                manager.end("room-1");
            }).not.toThrow();

            expect(server.log.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Failed to end game in room room-1",
                ),
            );
        });
    });

    describe("remove", () => {
        it("should remove a player from their room", () => {
            manager.create("host", "room-1");
            manager.join("host-2", "room-1");

            const result = manager.remove("host-2");

            expect(result).toBe("room-1");
            expect(
                manager.getRoomPlayers("room-1"),
            ).toEqual(["host"]);
        });

        it("should return null when the player is not in a room", () => {
            expect(manager.remove("unknown-player"))
                .toBeNull();
        });

        it("should delete the room when the removed player was alone", () => {
            manager.create("host", "room-1");

            const result = manager.remove("host");

            expect(result).toBeNull();
            expect(manager.roomExists("room-1"))
                .toBe(false);
        });

        it("should call removePlayer", () => {
            manager.create("host", "room-1");

            const room = roomInstances[0];

            manager.remove("host");

            expect(room.removePlayer)
                .toHaveBeenCalledWith("host");
        });

        it("should emit updated rooms when other players remain", () => {
            manager.create("host", "room-1");
            manager.join("player-1", "room-1");

            server.socketIO.emit.mockClear();

            manager.remove("player-1");

            expect(server.socketIO.emit).toHaveBeenCalledWith(
                "rooms",
                manager.getAllRoomStatus(),
            );
        });
    });

    describe("roomExists", () => {
        it("should return true when a room exists", () => {
            manager.create("host", "room-1");

            expect(
                manager.roomExists("room-1"),
            ).toBe(true);
        });

        it("should return false when a room does not exist", () => {
            expect(
                manager.roomExists("unknown-room"),
            ).toBe(false);
        });
    });

    describe("checkAvailable", () => {
        it("should return true when the player is not in any room", () => {
            manager.create("host", "room-1");

            expect(
                manager.checkAvailable("player-1"),
            ).toBe(true);
        });

        it("should return false when the player is in a room", () => {
            manager.create("host", "room-1")
            manager.join("player-1", "room-1");

            expect(
                manager.checkAvailable("host"),
            ).toBe(false);

            expect(
                manager.checkAvailable("player-1"),
            ).toBe(false);
        });
    });

    describe("getAllRoomStatus", () => {
        it("should return an empty array when there are no rooms", () => {
            expect(
                manager.getAllRoomStatus(),
            ).toEqual([]);
        });

        it("should return the status of every room", () => {
            manager.create("host-1", "room-1");
            manager.create("host-2", "room-2");

            const result = manager.getAllRoomStatus();

            expect(result).toHaveLength(2);

            expect(result[0]).toEqual({
                id: "room-1",
                host: "host-1",
                players: ["host-1"],
                maxPlayers: 4,
                gameOngoing: false,
            });

            expect(result[1]).toEqual({
                id: "room-2",
                host: "host-2",
                players: ["host-2"],
                maxPlayers: 4,
                gameOngoing: false,
            });
        });
    });

    describe("getRoomStatus", () => {
        it("should return the status of an existing room", () => {
            manager.create("host", "room-1");

            expect(
                manager.getRoomStatus("room-1"),
            ).toEqual({
                id: "room-1",
                host: "host",
                players: ["host"],
                maxPlayers: 4,
                gameOngoing: false,
            });
        });

        it("should return a default status for an unknown room", () => {
            expect(
                manager.getRoomStatus("unknown-room"),
            ).toEqual({
                id: "",
                host: "",
                players: [],
                maxPlayers: -1,
                gameOngoing: false,
            });
        });

        it("should log when the room does not exist", () => {
            manager.getRoomStatus("unknown-room");

            expect(server.log.info).toHaveBeenCalledWith(
                "Room unknown-room was not found",
            );
        });
    });

    describe("isNameTaken", () => {
        it("should return true when the name is used in the room", () => {
            userManager.addUser("host", "Alice");
            manager.create("host", "room-1");

            expect(manager.isNameTaken("room-1", "Alice")).toBe(true);
        });

        it("should return false when the name is only used in another room", () => {
            userManager.addUser("host", "Alice");
            userManager.addUser("host-2", "Bob");
            manager.create("host", "room-1");
            manager.create("host-2", "room-2");

            expect(manager.isNameTaken("room-1", "Bob")).toBe(false);
        });

        it("should return false for an unknown room", () => {
            expect(manager.isNameTaken("unknown-room", "Alice")).toBe(false);
        });
    });

    describe("getRoomPlayers", () => {
        it("should return players in an existing room", () => {
            manager.create("host", "room-1");
            manager.join("player-1", "room-1");

            expect(
                manager.getRoomPlayers("room-1"),
            ).toEqual(["host", "player-1"]);
        });

        it("should return null for an unknown room", () => {
            expect(
                manager.getRoomPlayers("unknown-room"),
            ).toBeNull();
        });

        it("should log when the room does not exist", () => {
            manager.getRoomPlayers("unknown-room");

            expect(server.log.info).toHaveBeenCalledWith(
                "Room unknown-room was not found",
            );
        });
    });

    describe("getPlayerRoom", () => {
        it("should return the room containing the player", () => {
            manager.create("host", "room-1");
            manager.join("player-1", "room-1");

            expect(
                manager.getPlayerRoom("player-1"),
            ).toBe("room-1");
        });

        it("should return null when the player is not in a room", () => {
            manager.create("host", "room-1");

            expect(
                manager.getPlayerRoom("unknown-player"),
            ).toBeNull();
        });

        it("should find a player across multiple rooms", () => {
            manager.create("host-1", "room-1");
            manager.create("host-2", "room-2");

            manager.join("player-1", "room-2");

            expect(
                manager.getPlayerRoom("player-1"),
            ).toBe("room-2");
        });
    });

    describe("gameend event", () => {
        it("should end the corresponding room when a game ends", () => {
            manager.create("host", "room-1");

            const room = roomInstances[0];

            gameManager.gameManagerEmitter.emit(
                "gameend",
                "room-1",
            );

            expect(room.end).toHaveBeenCalledOnce();
        });

        it("should emit updated rooms when a game ends", () => {
            manager.create("host", "room-1");

            server.socketIO.emit.mockClear();

            gameManager.gameManagerEmitter.emit(
                "gameend",
                "room-1",
            );

            expect(server.socketIO.emit).toHaveBeenCalledWith(
                "rooms",
                manager.getAllRoomStatus(),
            );
        });

        it("should handle gameend for an unknown room", () => {
            expect(() => {
                gameManager.gameManagerEmitter.emit(
                    "gameend",
                    "unknown-room",
                );
            }).not.toThrow();

            expect(server.log.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Failed to end game in room unknown-room",
                ),
            );
        });
    });
});
