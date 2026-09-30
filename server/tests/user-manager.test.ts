import { describe, expect, it, beforeEach } from "vitest";
import UserManager from "../src/back/user-manager.ts";

describe("UserManager", () => {
    let manager: UserManager;

    beforeEach(() => {
        manager = new UserManager();
    });

    describe("constructor", () => {
        it("should initialize with no users", () => {
            expect(manager.users).toEqual({});
        });
    });

    describe("addUser", () => {
        it("should add a user", () => {
            manager.addUser("user-1", "Alice");

            expect(manager.users).toEqual({
                "user-1": "Alice",
            });
        });

        it("should add multiple users", () => {
            manager.addUser("user-1", "Alice");
            manager.addUser("user-2", "Bob");

            expect(manager.users).toEqual({
                "user-1": "Alice",
                "user-2": "Bob",
            });
        });

        it("should make the user's name retrievable", () => {
            manager.addUser("user-1", "Alice");

            expect(
                manager.getUserName("user-1")
            ).toBe("Alice");
        });

        it("should overwrite an existing user's name", () => {
            manager.addUser("user-1", "Alice");
            manager.addUser("user-1", "Bob");

            expect(
                manager.getUserName("user-1")
            ).toBe("Bob");
        });

        it("should not create an additional user when overwriting", () => {
            manager.addUser("user-1", "Alice");
            manager.addUser("user-1", "Bob");

            expect(
                Object.keys(manager.users)
            ).toHaveLength(1);
        });
    });

    describe("removeUser", () => {
        it("should remove an existing user", () => {
            manager.addUser("user-1", "Alice");

            manager.removeUser("user-1");

            expect(manager.users).toEqual({});
        });

        it("should make the user's name unavailable after removal", () => {
            manager.addUser("user-1", "Alice");

            manager.removeUser("user-1");

            expect(
                manager.getUserName("user-1")
            ).toBeUndefined();
        });

        it("should remove only the specified user", () => {
            manager.addUser("user-1", "Alice");
            manager.addUser("user-2", "Bob");

            manager.removeUser("user-1");

            expect(manager.users).toEqual({
                "user-2": "Bob",
            });
        });

        it("should not throw when removing a user that does not exist", () => {
            expect(() => {
                manager.removeUser("unknown-user");
            }).not.toThrow();
        });

        it("should leave existing users unchanged when removing an unknown user", () => {
            manager.addUser("user-1", "Alice");

            manager.removeUser("unknown-user");

            expect(manager.users).toEqual({
                "user-1": "Alice",
            });
        });
    });

    describe("getUserName", () => {
        it("should return the user's name", () => {
            manager.addUser("user-1", "Alice");

            expect(
                manager.getUserName("user-1")
            ).toBe("Alice");
        });

        it("should return undefined for an unknown user", () => {
            expect(
                manager.getUserName("unknown-user")
            ).toBeUndefined();
        });

        it("should return undefined when the id is undefined", () => {
            expect(
                manager.getUserName(undefined)
            ).toBeUndefined();
        });

        it("should return the correct name when multiple users exist", () => {
            manager.addUser("user-1", "Alice");
            manager.addUser("user-2", "Bob");
            manager.addUser("user-3", "Charlie");

            expect(
                manager.getUserName("user-1")
            ).toBe("Alice");

            expect(
                manager.getUserName("user-2")
            ).toBe("Bob");

            expect(
                manager.getUserName("user-3")
            ).toBe("Charlie");
        });

        it("should reflect changes to an existing user", () => {
            manager.addUser("user-1", "Alice");

            expect(
                manager.getUserName("user-1")
            ).toBe("Alice");

            manager.addUser("user-1", "Bob");

            expect(
                manager.getUserName("user-1")
            ).toBe("Bob");
        });

        it("should return undefined after the user is removed", () => {
            manager.addUser("user-1", "Alice");
            manager.removeUser("user-1");

            expect(
                manager.getUserName("user-1")
            ).toBeUndefined();
        });
    });

    describe("user lifecycle", () => {
        it("should support adding, retrieving and removing a user", () => {
            manager.addUser("user-1", "Alice");

            expect(
                manager.getUserName("user-1")
            ).toBe("Alice");

            manager.removeUser("user-1");

            expect(
                manager.getUserName("user-1")
            ).toBeUndefined();
        });

        it("should support replacing a user's name", () => {
            manager.addUser("user-1", "Alice");

            expect(
                manager.getUserName("user-1")
            ).toBe("Alice");

            manager.addUser("user-1", "Bob");

            expect(
                manager.getUserName("user-1")
            ).toBe("Bob");
        });
    });
});
