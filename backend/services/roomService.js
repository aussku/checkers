const rooms = require("../store/roomStore");

const PLAYER_COLORS = ["blue", "green", "red"];

function sanitizePlayerSettings(settings = {}, fallbackName = "Player") {
  const name = typeof settings.name === "string"
    ? settings.name.trim().slice(0, 20)
    : "";
  const color = PLAYER_COLORS.includes(settings.color) ? settings.color : "blue";

  return {
    name: name || fallbackName,
    color,
  };
}

function getAvailableColor(room, preferredColor = "blue") {
  const takenColors = new Set(room.players.map(player => player.color));
  if (!takenColors.has(preferredColor)) return preferredColor;
  return PLAYER_COLORS.find(color => !takenColors.has(color)) || preferredColor;
}

function createPlayer(playerId, settings, fallbackName, room = null) {
  const sanitizedSettings = sanitizePlayerSettings(settings, fallbackName);
  const color = room
    ? getAvailableColor(room, sanitizedSettings.color)
    : sanitizedSettings.color;

  return {
    id: playerId,
    ready: false,
    name: sanitizedSettings.name,
    color,
  };
}

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

function createRoom(hostId, playerSettings = {}) {
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
    players: [createPlayer(hostId, playerSettings, "Player 1")],
    maxPlayers: 3,
    countdownTimer: null,
    createdAt: new Date(),
    gameSettings: {
      turnTimeLimit: 0,
      forcedCaptures: false,
    },
  };

  rooms.set(code, room);

  return room;
}

function getRoomByCode(code) {
  if (!code) return undefined;
  return rooms.get(code.toUpperCase());
}

function joinRoom(code, playerId, playerSettings = {}) {
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

  const newPlayer = createPlayer(playerId, playerSettings, `Player ${room.players.length + 1}`, room);
  room.players.push(newPlayer);

  return room;
}

function updatePlayerSettings(playerId, playerSettings = {}) {
  for (const room of rooms.values()) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) continue;

    const sanitizedSettings = sanitizePlayerSettings(playerSettings, player.name);
    const requestedColorTaken = room.players.some(
      p => p.id !== playerId && p.color === sanitizedSettings.color
    );

    player.name = sanitizedSettings.name;
    player.color = requestedColorTaken ? player.color : sanitizedSettings.color;

    return room;
  }

  return null;
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

function updateGameSettings(code, hostId, settings = {}) {
  const room = getRoomByCode(code);
  if (!room) throw new Error("Room not found");
  if (room.hostId !== hostId) throw new Error("Only the host can change settings");
  if (room.gameState) throw new Error("Cannot change settings after game has started");

  const turnTimeLimit = Number(settings.turnTimeLimit);
  room.gameSettings = {
    turnTimeLimit: Number.isFinite(turnTimeLimit) && turnTimeLimit >= 0 ? turnTimeLimit : 0,
    forcedCaptures: settings.forcedCaptures === true,
  };

  return room;
}

module.exports = {
  createRoom,
  joinRoom,
  getRoomByCode,
  toggleReady,
  updatePlayerSettings,
  sanitizePlayerSettings,
  updateGameSettings,
};