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
    countdownTimer: null,
    createdAt: new Date(),
  };

  rooms.set(code, room);

  return room;
}

function getRoomByCode(code) {
  return rooms.get(code.toUpperCase());
}

function joinRoom(code, playerId) {
  const room = getRoomByCode(code);

  if (!room) {
    throw new Error("Room not found");
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error("Room is full");
  }

  const isAlreadyInRoom = room.players.some(p => p.id === playerId);
  if (isAlreadyInRoom) {
    throw new Error("You are already in this room");
  }

  const newPlayer = { id: playerId, ready: false };
  room.players.push(newPlayer);

  return room;
}

function toggleReady(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error("Room not found");

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.ready = !player.ready;
  }
  
  // Check if everyone is ready and there are 3 players
  const allReady = room.players.length === 3 && room.players.every(p => p.ready);
  
  return { room, allReady };
}

module.exports = {
  createRoom,
  joinRoom,
  getRoomByCode,
  toggleReady
};