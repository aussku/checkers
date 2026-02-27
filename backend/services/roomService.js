const rooms = require("../store/roomStore");

function generateRoomCode(length = 4) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

function hostAlreadyHasRoom(hostId) {
  for (const room of rooms.values()) {
    if (room.hostId === hostId) return true;
  }
  return false;
}

function createRoom(hostId) {
  if (!hostId) throw new Error("Host ID required");

  if (hostAlreadyHasRoom(hostId)) {
    throw new Error("Host already has an active room");
  }

  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const room = {
    code,
    hostId,
    players: [{ id: hostId, ready: false }],
    maxPlayers: 3,
    createdAt: new Date(),
  };

  rooms.set(code, room);

  return room;
}

module.exports = {
  createRoom,
};