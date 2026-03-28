const rooms = require("../store/roomStore");
const {
  createRoom,
  joinRoom,
  toggleReady,
} = require("../services/roomService");

describe("roomService", () => {
  beforeEach(() => {
    rooms.clear();
  });

  test("createRoom creates a new room with the host as the first player", () => {
    const room = createRoom("host-1");

    expect(room.code).toHaveLength(4);
    expect(room.hostId).toBe("host-1");
    expect(room.players).toEqual([{ id: "host-1", ready: false }]);
    expect(room.maxPlayers).toBe(3);
    expect(rooms.get(room.code)).toBe(room);
  });

  test("toggleReady returns allReady only when three players are present and ready", () => {
    const room = createRoom("host-1");
    joinRoom(room.code, "player-2");
    joinRoom(room.code, "player-3");

    expect(toggleReady(room.code, "host-1").allReady).toBe(false);
    expect(toggleReady(room.code, "player-2").allReady).toBe(false);

    const result = toggleReady(room.code, "player-3");

    expect(result.allReady).toBe(true);
    expect(result.room.players).toEqual([
      { id: "host-1", ready: true },
      { id: "player-2", ready: true },
      { id: "player-3", ready: true },
    ]);
  });

  test("createRoom throws error if host already has a room", () => {
    createRoom("host-1");
    
    expect(() => {
      createRoom("host-1");
    }).toThrow("Host already has an active room");
  });

  test("joinRoom throws error if room not found", () => {
    expect(() => {
      joinRoom("FAKE", "player-1");
    }).toThrow("Room not found");
  });

  test("joinRoom throws error if room is full", () => {
    const room = createRoom("host-1");
    joinRoom(room.code, "player-2");
    joinRoom(room.code, "player-3");
    
    expect(() => {
      joinRoom(room.code, "player-4");
    }).toThrow("Room is full");
  });

  test("joinRoom throws error if player already in room", () => {
    const room = createRoom("host-1");
    joinRoom(room.code, "player-2");
    
    expect(() => {
      joinRoom(room.code, "player-2");
    }).toThrow("You are already in this room");
  });

  test("createRoom allows different hosts to create rooms", () => {
    const room1 = createRoom("host-1");
    const room2 = createRoom("host-2");
    
    expect(room1.code).not.toBe(room2.code);
    expect(room1.hostId).toBe("host-1");
    expect(room2.hostId).toBe("host-2");
  });

  test("toggleReady does nothing if player not found", () => {
    const room = createRoom("host-1");
    
    const { room: updatedRoom, allReady } = toggleReady(room.code, "nonexistent-player");
    
    expect(allReady).toBe(false);
    expect(updatedRoom.players[0].ready).toBe(false);
  });

  test("createRoom throws error if hostId is missing", () => {
    expect(() => {
      createRoom();
    }).toThrow("Host ID required");
    
    expect(() => {
      createRoom(null);
    }).toThrow("Host ID required");
    
    expect(() => {
      createRoom("");
    }).toThrow("Host ID required");
  });

  test("toggleReady throws error if room not found", () => {
    expect(() => {
      toggleReady("NONEXISTENT", "player-1");
    }).toThrow("Room not found");
  });
});