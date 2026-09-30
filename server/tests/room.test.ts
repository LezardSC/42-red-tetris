import { beforeEach, describe, expect, it, vi } from "vitest";

import Room from "../src/back/room.ts";
import UserManager from "../src/back/user-manager.ts";

describe("Room", () => {
    let userManager: UserManager;

    const createRoom = (
        host: string = "host",
        roomId: string = "room-1",
    ) => {
        return new Room(
            userManager,
            host,
            roomId,
        );
    };

    beforeEach(() => {
        userManager = new UserManager();
    });

    describe("constructor", () => {
        it("should initialize the room id", () => {
            const room = createRoom(
                "host",
                "room-1",
            );

            expect(room.id).toBe("room-1");
        });

        it("should initialize the host", () => {
            const room = createRoom(
                "player-1",
                "room-1",
            );

            expect(room.host).toBe("player-1");
        });

        it("should add the host to the players", () => {
            const room = createRoom(
                "host",
                "room-1",
            );

            expect(room.players).toEqual(["host"]);
        });

        it("should initialize with one player", () => {
            const room = createRoom();

            expect(room.players).toHaveLength(1);
        });

        it("should initialize maxPlayers to four", () => {
            const room = createRoom();

            expect(room.maxPlayers).toBe(4);
        });

        it("should initialize gameOngoing to false", () => {
            const room = createRoom();

            expect(room.gameOngoing).toBe(false);
        });

        it("should store the user manager", () => {
            const room = createRoom();

            expect(room.userManager).toBe(userManager);
        });
    });

    describe("addPlayer", () => {
        it("should add a player to the room", () => {
            const room = createRoom();

            room.addPlayer("player-1");

            expect(room.players).toEqual([
                "host",
                "player-1",
            ]);
        });

        it("should increase the number of players", () => {
            const room = createRoom();

            room.addPlayer("player-1");
            room.addPlayer("player-2");

            expect(room.players).toHaveLength(3);
        });

        it("should allow the room to reach its maximum capacity", () => {
            const room = createRoom();

            room.addPlayer("player-1");
            room.addPlayer("player-2");
            room.addPlayer("player-3");

            expect(room.players).toHaveLength(4);
        });

        it("should throw when the room is full", () => {
            const room = createRoom();

            room.addPlayer("player-1");
            room.addPlayer("player-2");
            room.addPlayer("player-3");

            expect(() => {
                room.addPlayer("player-4");
            }).toThrow("Room is full.");
        });

        it("should not add the player when the room is full", () => {
            const room = createRoom();

            room.addPlayer("player-1");
            room.addPlayer("player-2");
            room.addPlayer("player-3");

            expect(() => {
                room.addPlayer("player-4");
            }).toThrow();

            expect(room.players).toEqual([
                "host",
                "player-1",
                "player-2",
                "player-3",
            ]);
        });

        it("should not allow duplicate player ids", () => {
            const room = createRoom();

            room.addPlayer("player-1");
            expect(() => {
                room.addPlayer("player-1");
            }).toThrow("Player player-1 already in the room.");
        });
    });

    describe("removePlayer", () => {
        it("should remove a player from the room", () => {
            const room = createRoom();

            room.addPlayer("player-1");

            room.removePlayer("player-1");

            expect(room.players).toEqual(["host"]);
        });

        it("should remove the correct player", () => {
            const room = createRoom();

            room.addPlayer("player-1");
            room.addPlayer("player-2");

            room.removePlayer("player-1");

            expect(room.players).toEqual([
                "host",
                "player-2",
            ]);
        });

        it("should throw when the player does not exist", () => {
            const room = createRoom();

            expect(() => {
                room.removePlayer("unknown-player");
            }).toThrow(
                "Failed to remove player unknown-player from room room-1 because it wasn't found.",
            );
        });

        it("should transfer host to the first remaining player", () => {
            const room = createRoom("host");

            room.addPlayer("player-1");
            room.addPlayer("player-2");

            room.removePlayer("host");

            expect(room.host).toBe("player-1");
            expect(room.players).toEqual([
                "player-1",
                "player-2",
            ]);
        });

        it("should transfer host to the first player in the list", () => {
            const room = createRoom("host");

            room.addPlayer("player-1");
            room.addPlayer("player-2");
            room.addPlayer("player-3");

            room.removePlayer("host");

            expect(room.host).toBe("player-1");
        });

        it("should leave the host unchanged when removing another player", () => {
            const room = createRoom("host");

            room.addPlayer("player-1");

            room.removePlayer("player-1");

            expect(room.host).toBe("host");
        });

        it("should allow the host to be removed when they are the only player", () => {
            const room = createRoom("host");

            room.removePlayer("host");

            expect(room.players).toEqual([]);
        });

        it("should leave host unchanged when the last non-host player is removed", () => {
            const room = createRoom("host");

            room.addPlayer("player-1");

            room.removePlayer("player-1");

            expect(room.host).toBe("host");
            expect(room.players).toEqual(["host"]);
        });
    });

    describe("start", () => {
        it("should start the game when the host starts it", () => {
            const room = createRoom("host");

            room.start("host");

            expect(room.gameOngoing).toBe(true);
        });

        it("should throw when a non-host starts the game", () => {
            const room = createRoom("host");

            expect(() => {
                room.start("player-1");
            }).toThrow(
                "Failed to start game in room room-1 because player player-1 is not the host. Host is host.",
            );
        });

        it("should not start the game when a non-host attempts to start it", () => {
            const room = createRoom("host");

            expect(() => {
                room.start("player-1");
            }).toThrow();

            expect(room.gameOngoing).toBe(false);
        });

        it("should throw when the game is already ongoing", () => {
            const room = createRoom("host");

            room.start("host");

            expect(() => {
                room.start("host");
            }).toThrow(
                "Failed to start game in room room-1 because the game is ongoing",
            );
        });

        it("should keep the game ongoing after a second start attempt", () => {
            const room = createRoom("host");

            room.start("host");

            expect(() => {
                room.start("host");
            }).toThrow();

            expect(room.gameOngoing).toBe(true);
        });

        it("should allow the new host to start after the original host leaves", () => {
            const room = createRoom("host");

            room.addPlayer("player-1");
            room.removePlayer("host");

            room.start("player-1");

            expect(room.gameOngoing).toBe(true);
        });
    });

    describe("end", () => {
        it("should end an ongoing game", () => {
            const room = createRoom("host");

            room.start("host");
            room.end();

            expect(room.gameOngoing).toBe(false);
        });

        it("should remain not ongoing when ending an inactive game", () => {
            const room = createRoom("host");

            room.end();

            expect(room.gameOngoing).toBe(false);
        });

        it("should allow a new game to start after ending", () => {
            const room = createRoom("host");

            room.start("host");
            room.end();
            room.start("host");

            expect(room.gameOngoing).toBe(true);
        });
    });

    describe("getStatus", () => {
        it("should return the room id", () => {
            const room = createRoom(
                "host",
                "room-42",
            );

            const status = room.getStatus();

            expect(status.id).toBe("room-42");
        });

        it("should return the host username", () => {
            const getUserName = vi
                .spyOn(userManager, "getUserName")
                .mockReturnValue("Host Name");

            const room = createRoom("host");

            const status = room.getStatus();

            expect(status.host).toBe("Host Name");

            expect(getUserName).toHaveBeenCalledWith("host");
        });

        it("should return the usernames of all players", () => {
            vi.spyOn(userManager, "getUserName")
                .mockImplementation((playerId) => {
                    if (playerId === "host") {
                        return "Host Name";
                    }

                    if (playerId === "player-1") {
                        return "Player One";
                    }

                    return undefined;
                });

            const room = createRoom("host");

            room.addPlayer("player-1");

            const status = room.getStatus();

            expect(status.players).toEqual([
                "Host Name",
                "Player One",
            ]);
        });

        it("should look up every player's username", () => {
            const getUserName = vi
                .spyOn(userManager, "getUserName")
                .mockReturnValue("User");

            const room = createRoom("host");

            room.addPlayer("player-1");
            room.addPlayer("player-2");

            room.getStatus();

            expect(getUserName).toHaveBeenCalledWith("host");
            expect(getUserName).toHaveBeenCalledWith(
                "player-1",
            );
            expect(getUserName).toHaveBeenCalledWith(
                "player-2",
            );

            expect(getUserName).toHaveBeenCalledTimes(4);
        });

        it("should return maxPlayers", () => {
            const room = createRoom();

            const status = room.getStatus();

            expect(status.maxPlayers).toBe(4);
        });

        it("should return the current game state", () => {
            const room = createRoom();

            expect(room.getStatus().gameOngoing)
                .toBe(false);

            room.start("host");

            expect(room.getStatus().gameOngoing)
                .toBe(true);

            room.end();

            expect(room.getStatus().gameOngoing)
                .toBe(false);
        });

        it("should return undefined for unknown usernames", () => {
            vi.spyOn(userManager, "getUserName")
                .mockReturnValue(undefined);

            const room = createRoom("unknown-user");

            const status = room.getStatus();

            expect(status.host).toBeUndefined();
            expect(status.players).toEqual([
                undefined,
            ]);
        });

        it("should return the complete room status", () => {
            vi.spyOn(userManager, "getUserName")
                .mockImplementation((playerId) => {
                    if (playerId === "host") {
                        return "Alice";
                    }

                    if (playerId === "player-1") {
                        return "Bob";
                    }

                    return undefined;
                });

            const room = createRoom(
                "host",
                "room-1",
            );

            room.addPlayer("player-1");

            const status = room.getStatus();

            expect(status).toEqual({
                id: "room-1",
                host: "Alice",
                players: [
                    "Alice",
                    "Bob",
                ],
                maxPlayers: 4,
                gameOngoing: false,
            });
        });
    });

    describe("room lifecycle", () => {
        it("should support creating, joining, starting, ending and leaving", () => {
            const room = createRoom("host");

            expect(room.players).toEqual(["host"]);

            room.addPlayer("player-1");

            expect(room.players).toEqual([
                "host",
                "player-1",
            ]);

            room.start("host");

            expect(room.gameOngoing).toBe(true);

            room.end();

            expect(room.gameOngoing).toBe(false);

            room.removePlayer("player-1");

            expect(room.players).toEqual(["host"]);
        });

        it("should support host leaving and transferring ownership", () => {
            const room = createRoom("host");

            room.addPlayer("player-1");
            room.addPlayer("player-2");

            room.removePlayer("host");

            expect(room.host).toBe("player-1");
            expect(room.players).toEqual([
                "player-1",
                "player-2",
            ]);

            room.start("player-1");

            expect(room.gameOngoing).toBe(true);
        });
    });
});
