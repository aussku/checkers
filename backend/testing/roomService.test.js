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
});
