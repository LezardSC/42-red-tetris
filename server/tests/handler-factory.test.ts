import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { EventEmitter } from "events";

import HandlerFactory from "../src/server/handler-factory.ts";
import UserManager from "../src/back/user-manager.ts";
import RoomManager from "../src/back/room-manager.ts";
import GameManager from "../src/back/game-manager.ts";

describe("HandlerFactory", () => {
    let server: any;
    let roomManager: RoomManager;
    let gameManager: GameManager;
    let userManager: UserManager;
    let factory: HandlerFactory;
    let socket: any;

    beforeEach(() => {
        server = {
            log: {
                info: vi.fn(),
            },
            socketIO: {
                emit: vi.fn(),
                to: vi.fn(),
            },
        };

        // socketIO.to(roomId).emit(...)
        server.socketIO.to.mockImplementation(() => ({
            emit: vi.fn(),
        }));

        roomManager = {
            roomExists: vi.fn(),
            create: vi.fn(),
            join: vi.fn(),
            leave: vi.fn(),
            remove: vi.fn(),
            checkAvailable: vi.fn(),
            isNameTaken: vi.fn(() => false),
            getRoomStatus: vi.fn(),
            getRoomPlayers: vi.fn(),
            getPlayerRoom: vi.fn(),
            start: vi.fn(),
        } as unknown as RoomManager;

        gameManager = {
            gameManagerEmitter: new EventEmitter(),
            removePlayer: vi.fn(),
            checkGameOngoing: vi.fn(),
            startGame: vi.fn(),
            keyPressed: vi.fn(),
            keyReleased: vi.fn(),
        } as unknown as GameManager;

        userManager = {
            addUser: vi.fn(),
            removeUser: vi.fn(),
            getUserName: vi.fn(),
        } as unknown as UserManager;

        factory = new HandlerFactory(
            server,
            roomManager,
            gameManager,
            userManager,
        );

        socket = {
            id: "socket-1",
            join: vi.fn(),
            leave: vi.fn(),
        };
    });

    describe("constructor", () => {
        it("should store the server", () => {
            expect(factory.server).toBe(server);
        });

        it("should store the room manager", () => {
            expect(factory.roomManager).toBe(roomManager);
        });

        it("should store the game manager", () => {
            expect(factory.gameManager).toBe(gameManager);
        });

        it("should store the user manager", () => {
            expect(factory.userManager).toBe(userManager);
        });

        it("should initialize the username validation regex", () => {
            expect(factory.regex.test("Player-123")).toBe(true);
            expect(factory.regex.test("Player*123")).toBe(false);
        });

        it("should initialize the maximum username length", () => {
            expect(factory.maxNameLength).toBe(16);
        });
    });

    describe("registerGameEvents", () => {
        it("should emit playerlost with the player's username", () => {
            vi.spyOn(userManager, "getUserName")
                .mockReturnValue("Alice");

            factory.registerGameEvents();

            gameManager.gameManagerEmitter.emit(
                "playerlost",
                "game-1",
                "socket-1",
            );

            expect(userManager.getUserName)
                .toHaveBeenCalledWith("socket-1");

            expect(server.socketIO.to)
                .toHaveBeenCalledWith("game-1");

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "playerlost",
                {
                    name: "Alice",
                },
            );
        });

        it("should emit null when the losing player has no username", () => {
            vi.spyOn(userManager, "getUserName")
                .mockReturnValue(undefined);

            factory.registerGameEvents();

            gameManager.gameManagerEmitter.emit(
                "playerlost",
                "game-1",
                "socket-1",
            );

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "playerlost",
                {
                    name: null,
                },
            );
        });

        it("should emit gameend with the winner's username", () => {
            vi.spyOn(userManager, "getUserName")
                .mockReturnValue("Alice");

            vi.spyOn(roomManager, "roomExists")
                .mockReturnValue(false);

            factory.registerGameEvents();

            gameManager.gameManagerEmitter.emit(
                "gameend",
                "game-1",
                "socket-1",
            );

            expect(userManager.getUserName)
                .toHaveBeenCalledWith("socket-1");

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "gameend",
                {
                    winner: "Alice",
                },
            );
        });

        it("should emit null when there is no winner", () => {
            vi.spyOn(userManager, "getUserName")
                .mockReturnValue(undefined);

            vi.spyOn(roomManager, "roomExists")
                .mockReturnValue(false);

            factory.registerGameEvents();

            gameManager.gameManagerEmitter.emit(
                "gameend",
                "game-1",
                null,
            );

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "gameend",
                {
                    winner: null,
                },
            );
        });

        it("should emit room status when the room still exists", () => {
            const status = {
                id: "game-1",
                host: "Alice",
                players: ["Alice", "Bob"],
                maxPlayers: 4,
                gameOngoing: false,
            };

            vi.spyOn(userManager, "getUserName")
                .mockReturnValue("Alice");

            vi.spyOn(roomManager, "roomExists")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "getRoomStatus")
                .mockReturnValue(status);

            factory.registerGameEvents();

            gameManager.gameManagerEmitter.emit(
                "gameend",
                "game-1",
                "socket-1",
            );

            expect(roomManager.roomExists)
                .toHaveBeenCalledWith("game-1");

            expect(roomManager.getRoomStatus)
                .toHaveBeenCalledWith("game-1");

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "gameend",
                {winner: "Alice"},
            );
        });

        it("should not emit room status when the room no longer exists", () => {
            vi.spyOn(roomManager, "roomExists")
                .mockReturnValue(false);

            factory.registerGameEvents();

            gameManager.gameManagerEmitter.emit(
                "gameend",
                "game-1",
                "socket-1",
            );

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledTimes(1);
            expect(room.emit).toHaveBeenCalledWith(
                "gameend",
                expect.any(Object),
            );
        });
    });

    describe("createDisconnectHandler", () => {
        it("should remove the player from the game", () => {
            vi.spyOn(roomManager, "remove")
                .mockReturnValue(null);

            const handler =
                factory.createDisconnectHandler(socket);

            handler("transport close");

            expect(gameManager.removePlayer)
                .toHaveBeenCalledWith("socket-1");
        });

        it("should remove the player from the room", () => {
            vi.spyOn(roomManager, "remove")
                .mockReturnValue(null);

            const handler =
                factory.createDisconnectHandler(socket);

            handler("transport close");

            expect(roomManager.remove)
                .toHaveBeenCalledWith("socket-1");
        });

        it("should remove the user from the user manager", () => {
            vi.spyOn(roomManager, "remove")
                .mockReturnValue(null);

            const handler =
                factory.createDisconnectHandler(socket);

            handler("transport close");

            expect(userManager.removeUser)
                .toHaveBeenCalledWith("socket-1");
        });

        it("should log the disconnection", () => {
            vi.spyOn(roomManager, "remove")
                .mockReturnValue(null);

            const handler =
                factory.createDisconnectHandler(socket);

            handler("transport close");

            expect(server.log.info)
                .toHaveBeenCalledWith(
                    "Socket socket-1 disconnected. Reason: transport close",
                );
        });

        it("should emit room status when the player was in a room", () => {
            vi.spyOn(roomManager, "remove")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "getRoomStatus")
                .mockReturnValue({
                    id: "room-1",
                    host: "Alice",
                    players: ["Alice"],
                    maxPlayers: 4,
                    gameOngoing: false,
                });

            const handler =
                factory.createDisconnectHandler(socket);

            handler("transport close");

            expect(server.socketIO.to)
                .toHaveBeenCalledWith("room-1");

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "roomstatus",
                expect.any(Object),
            );
        });

        it("should not emit room status when the player was not in a room", () => {
            vi.spyOn(roomManager, "remove")
                .mockReturnValue(null);

            const handler =
                factory.createDisconnectHandler(socket);

            handler("transport close");

            expect(server.socketIO.to)
                .not.toHaveBeenCalled();
        });

        it("should log that the user was removed", () => {
            vi.spyOn(roomManager, "remove")
                .mockReturnValue(null);

            const handler =
                factory.createDisconnectHandler(socket);

            handler("transport close");

            expect(server.log.info)
                .toHaveBeenCalledWith(
                    "Removed user socket-1.",
                );
        });
    });

    describe("createPlayerNameHandler", () => {
        it("should add a valid username", () => {
            vi.spyOn(roomManager, "checkAvailable")
                .mockReturnValue(true);

            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler("Alice", ack);

            expect(userManager.addUser)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "Alice",
                );

            expect(ack)
                .toHaveBeenCalledWith("");
        });

        it("should accept names containing numbers", () => {
            vi.spyOn(roomManager, "checkAvailable")
                .mockReturnValue(true);

            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler("Alice123", ack);

            expect(userManager.addUser)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "Alice123",
                );
        });

        it("should accept names containing underscores", () => {
            vi.spyOn(roomManager, "checkAvailable")
                .mockReturnValue(true);

            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler("Alice_123", ack);

            expect(userManager.addUser)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "Alice_123",
                );
        });

        it("should reject non-string names", () => {
            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler(123, ack);

            expect(ack).toHaveBeenCalledWith(
                "Username must be 1 to 16 letters, numbers or underscores.",
            );

            expect(userManager.addUser)
                .not.toHaveBeenCalled();
        });

        it("should reject names containing special characters", () => {
            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler("Alice!", ack);

            expect(ack).toHaveBeenCalledWith(
                "Username must be 1 to 16 letters, numbers or underscores.",
            );
        });

        it("should reject names containing spaces", () => {
            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler("Alice Bob", ack);

            expect(ack).toHaveBeenCalledWith(
                "Username must be 1 to 16 letters, numbers or underscores.",
            );
        });

        it("should reject empty names", () => {
            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler("", ack);

            expect(ack).toHaveBeenCalledWith(
                "Username must be 1 to 16 letters, numbers or underscores.",
            );
        });

        it("should reject names longer than 16 characters", () => {
            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler("12345678901234567", ack);

            expect(ack).toHaveBeenCalledWith(
                "Username must be 1 to 16 letters, numbers or underscores.",
            );
        });

        it("should accept a name exactly 16 characters long", () => {
            vi.spyOn(roomManager, "checkAvailable")
                .mockReturnValue(true);

            const ack = vi.fn();
            const name = "1234567890123456";

            const handler =
                factory.createPlayerNameHandler(socket);

            handler(name, ack);

            expect(userManager.addUser)
                .toHaveBeenCalledWith(
                    "socket-1",
                    name,
                );

            expect(ack)
                .toHaveBeenCalledWith("");
        });

        it("should reject changing username while in a room", () => {
            vi.spyOn(roomManager, "checkAvailable")
                .mockReturnValue(false);

            const ack = vi.fn();

            const handler =
                factory.createPlayerNameHandler(socket);

            handler("Alice", ack);

            expect(ack).toHaveBeenCalledWith(
                "Cannot change username while in a room.",
            );

            expect(userManager.addUser)
                .not.toHaveBeenCalled();
        });

        it("should use an empty callback when no ack is supplied", () => {
            vi.spyOn(roomManager, "checkAvailable")
                .mockReturnValue(true);

            const handler =
                factory.createPlayerNameHandler(socket);

            expect(() => {
                handler("Alice");
            }).not.toThrow();

            expect(userManager.addUser)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "Alice",
                );
        });
    });

    describe("createJoinHandler", () => {
        beforeEach(() => {
            vi.spyOn(userManager, "getUserName")
                .mockReturnValue("Alice");

            vi.spyOn(roomManager, "checkAvailable")
                .mockReturnValue(true);

            vi.spyOn(gameManager, "checkGameOngoing")
                .mockReturnValue(false);
        });

        it("should reject an invalid room id", () => {
            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-!", ack);

            expect(ack).toHaveBeenCalledWith(
                "Room name can only contain letters, numbers and underscores.",
            );

            expect(roomManager.roomExists)
                .not.toHaveBeenCalled();
        });

        it("should reject a non-string room id", () => {
            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler(123, ack);

            expect(ack).toHaveBeenCalledWith(
                "Room name can only contain letters, numbers and underscores.",
            );
        });

        it("should reject joining without a username", () => {
            vi.spyOn(userManager, "getUserName")
                .mockReturnValue(undefined);

            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-1", ack);

            expect(ack).toHaveBeenCalledWith(
                "Please choose a username first.",
            );

            expect(roomManager.create)
                .not.toHaveBeenCalled();

            expect(roomManager.join)
                .not.toHaveBeenCalled();
        });

        it("should reject joining when already in a room", () => {
            vi.spyOn(roomManager, "checkAvailable")
                .mockReturnValue(false);

            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-1", ack);

            expect(ack).toHaveBeenCalledWith(
                "You are already in a room.",
            );
        });

        it("should reject joining a room with an ongoing game", () => {
            vi.spyOn(gameManager, "checkGameOngoing")
                .mockReturnValue(true);

            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-1", ack);

            expect(ack).toHaveBeenCalledWith(
                "A game is in progress in this room. Try again after it ends.",
            );
        });

        it("should reject joining when the username is taken in the room", () => {
            vi.spyOn(roomManager, "isNameTaken")
                .mockReturnValue(true);

            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-1", ack);

            expect(roomManager.isNameTaken)
                .toHaveBeenCalledWith("room-1", "Alice");

            expect(ack).toHaveBeenCalledWith(
                "This username is already taken in this room.",
            );

            expect(roomManager.join)
                .not.toHaveBeenCalled();

            expect(socket.join)
                .not.toHaveBeenCalled();
        });

        it("should join an existing room", () => {
            vi.spyOn(roomManager, "roomExists")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "join")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "getRoomStatus")
                .mockReturnValue({
                    id: "room-1",
                    host: "Alice",
                    players: ["Alice", "Bob"],
                    maxPlayers: 4,
                    gameOngoing: false,
                });

            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-1", ack);

            expect(roomManager.join)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "room-1",
                );

            expect(socket.join)
                .toHaveBeenCalledWith("room-1");

            expect(ack)
                .toHaveBeenCalledWith("");
        });

        it("should create a new room when the room does not exist", () => {
            vi.spyOn(roomManager, "roomExists")
                .mockReturnValue(false);

            vi.spyOn(roomManager, "create")
                .mockReturnValue(true);

            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-1", ack);

            expect(roomManager.create)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "room-1",
                );

            expect(socket.join)
                .toHaveBeenCalledWith("room-1");

            expect(ack)
                .toHaveBeenCalledWith("");
        });

        it("should emit room status after successfully joining", () => {
            vi.spyOn(roomManager, "roomExists")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "join")
                .mockReturnValue(true);

            const status = {
                id: "room-1",
                host: "Alice",
                players: ["Alice", "Bob"],
                maxPlayers: 4,
                gameOngoing: false,
            };

            vi.spyOn(roomManager, "getRoomStatus")
                .mockReturnValue(status);

            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-1", ack);

            expect(server.socketIO.to)
                .toHaveBeenCalledWith("room-1");

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "roomstatus",
                status,
            );
        });

        it("should report when joining a room fails", () => {
            vi.spyOn(roomManager, "roomExists")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "join")
                .mockReturnValue(false);

            const ack = vi.fn();

            const handler =
                factory.createJoinHandler(socket);

            handler("room-1", ack);

            expect(ack).toHaveBeenCalledWith(
                "This room is full.",
            );

            expect(socket.join)
                .not.toHaveBeenCalled();
        });
    });

    describe("createLeaveHandler", () => {
        it("should do nothing when the player is not in a valid room", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue(null);

            const handler =
                factory.createLeaveHandler(socket);

            handler();

            expect(gameManager.removePlayer)
                .not.toHaveBeenCalled();

            expect(roomManager.leave)
                .not.toHaveBeenCalled();
        });

        it("should remove the player from the game", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "leave")
                .mockReturnValue(true);

            const handler =
                factory.createLeaveHandler(socket);

            handler();

            expect(gameManager.removePlayer)
                .toHaveBeenCalledWith("socket-1");
        });

        it("should leave the room", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "leave")
                .mockReturnValue(true);

            const handler =
                factory.createLeaveHandler(socket);

            handler();

            expect(roomManager.leave)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "room-1",
                );
        });

        it("should emit the updated room status after leaving", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "leave")
                .mockReturnValue(true);

            const status = {
                id: "room-1",
                host: "Alice",
                players: ["Alice"],
                maxPlayers: 4,
                gameOngoing: false,
            };

            vi.spyOn(roomManager, "getRoomStatus")
                .mockReturnValue(status);

            const handler =
                factory.createLeaveHandler(socket);

            handler();

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "roomstatus",
                status,
            );
        });

        it("should leave the socket room after successfully leaving", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "leave")
                .mockReturnValue(true);

            const handler =
                factory.createLeaveHandler(socket);

            handler();

            expect(socket.leave)
                .toHaveBeenCalledWith("room-1");
        });

        it("should not leave the socket room when RoomManager.leave fails", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "leave")
                .mockReturnValue(false);

            const handler =
                factory.createLeaveHandler(socket);

            handler();

            expect(socket.leave)
                .not.toHaveBeenCalled();
        });
    });

    describe("createStartHandler", () => {
        beforeEach(() => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "start")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "getRoomPlayers")
                .mockReturnValue([
                    "socket-1",
                    "socket-2",
                ]);
        });

        it("should do nothing when the player is not in a valid room", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue(null);

            const handler =
                factory.createStartHandler(socket);

            handler();

            expect(roomManager.start)
                .not.toHaveBeenCalled();

            expect(gameManager.startGame)
                .not.toHaveBeenCalled();
        });

        it("should start the room", () => {

            const handler =
                factory.createStartHandler(socket);

            handler();

            expect(roomManager.start)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "room-1",
                );
        });

        it("should emit gamestarting when the room starts successfully", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "start")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "getRoomPlayers")
                .mockReturnValue(["socket-1"]);

            const handler =
                factory.createStartHandler(socket);

            handler();

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit)
                .toHaveBeenCalledWith("gamestarting");
        });

        it("should emit room status when the game starts", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "start")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "getRoomPlayers")
                .mockReturnValue(["socket-1"]);

            const status = {
                id: "room-1",
                host: "Alice",
                players: ["Alice"],
                maxPlayers: 4,
                gameOngoing: true,
            };

            vi.spyOn(roomManager, "getRoomStatus")
                .mockReturnValue(status);

            const handler =
                factory.createStartHandler(socket);

            handler();

            const room = server.socketIO.to.mock.results[0].value;

            expect(room.emit).toHaveBeenCalledWith(
                "gamestarting",
            );
        });

        it("should start the game with the room players", () => {
            const handler = factory.createStartHandler(socket);

            handler();

            expect(gameManager.startGame).toHaveBeenCalledWith(
                userManager,
                "room-1",
                ["socket-1", "socket-2"],
            );
        });

        it("should not start a game when RoomManager.start fails", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "start")
                .mockReturnValue(false);

            const handler =
                factory.createStartHandler(socket);

            handler();

            expect(gameManager.startGame)
                .not.toHaveBeenCalled();
        });

        it("should not start a game when there are no room players", () => {
            vi.spyOn(roomManager, "getPlayerRoom")
                .mockReturnValue("room-1");

            vi.spyOn(roomManager, "start")
                .mockReturnValue(true);

            vi.spyOn(roomManager, "getRoomPlayers")
                .mockReturnValue(null);

            const handler =
                factory.createStartHandler(socket);

            handler();

            expect(gameManager.startGame)
                .not.toHaveBeenCalled();
        });
    });

    describe("createKeyPressedHandler", () => {
        it("should forward the key press to GameManager", () => {
            const handler =
                factory.createKeyPressedHandler(socket);

            handler("ArrowLeft");

            expect(gameManager.keyPressed)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "ArrowLeft",
                );
        });

        it("should forward any key value", () => {
            const handler =
                factory.createKeyPressedHandler(socket);

            handler(123);

            expect(gameManager.keyPressed)
                .toHaveBeenCalledWith(
                    "socket-1",
                    123,
                );
        });
    });

    describe("createKeyReleasedHandler", () => {
        it("should forward the key release to GameManager", () => {
            const handler =
                factory.createKeyReleasedHandler(socket);

            handler("ArrowLeft");

            expect(gameManager.keyReleased)
                .toHaveBeenCalledWith(
                    "socket-1",
                    "ArrowLeft",
                );
        });

        it("should forward any key value", () => {
            const handler =
                factory.createKeyReleasedHandler(socket);

            handler(123);

            expect(gameManager.keyReleased)
                .toHaveBeenCalledWith(
                    "socket-1",
                    123,
                );
        });
    });
});
