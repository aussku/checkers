const {
  createRoom,
  joinRoom,
  toggleReady,
  updatePlayerSettings,
} = require("../services/roomService");
const { initializeGameState } = require("../services/boardService");
const rooms = require("../store/roomStore");

function registerRoomHandlers(io, socket) {
  socket.on("voteRematch", (accept) => {
    let roomCode = null;
    let currentRoom = null;
    
    for (const [code, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        roomCode = code;
        currentRoom = room;
        break;
      }
    }

    if (!currentRoom || currentRoom.gameState?.status !== "finished") return;

    if (!currentRoom.rematchVotes) {
      currentRoom.rematchVotes = new Set();
    }

    if (!accept) {
      currentRoom.rematchVotes.clear();
      currentRoom.players.forEach(p => p.ready = false);
      delete currentRoom.gameState;

      io.to(roomCode).emit("rematchDeclined");
      
      io.to(roomCode).emit("roomUpdate", {
        code: roomCode,
        players: currentRoom.players,
        hostId: currentRoom.hostId,
      });
      return;
    }

    currentRoom.rematchVotes.add(socket.id);

    io.to(roomCode).emit("rematchVoteUpdate", {
      acceptedCount: currentRoom.rematchVotes.size,
      total: currentRoom.players.length
    });

    if (currentRoom.rematchVotes.size === currentRoom.players.length && currentRoom.players.length > 0) {
      currentRoom.rematchVotes.clear();
      
      currentRoom.gameState = initializeGameState(currentRoom.players);
      
      io.to(roomCode).emit("gameStarted", {
        gameState: currentRoom.gameState,
      });
    }
  });


  const cleanupRoom = () => {
    for (const [code, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        if (room.gameState && room.gameState.status === "finished") {
          if (room.rematchVotes) room.rematchVotes.clear();
          
          room.players.forEach(p => p.ready = false);
          delete room.gameState;
          
          io.to(code).emit("rematchDeclined");
        }

        room.players.splice(playerIndex, 1);

        if (room.countdownTimer) {
          clearTimeout(room.countdownTimer);
          room.countdownTimer = null;
          io.to(code).emit("cancelCountdown");
        }

        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          if (socket.id === room.hostId) {
            room.hostId = room.players[0].id;
          }

          io.to(code).emit("roomUpdate", {
            code,
            players: room.players,
            hostId: room.hostId,
          });
        }

        socket.leave(code);
        break;
      }
    }
  };

  socket.on("createRoom", (playerSettings = {}) => {
    try {
      const room = createRoom(socket.id, playerSettings);
      socket.join(room.code);
      socket.emit("roomCreated", {
        code: room.code,
        players: room.players,
      });
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("joinRoom", (payload = {}) => {
    try {
      const code = typeof payload === "string" ? payload : payload.code;
      const playerSettings = typeof payload === "string" ? {} : payload.playerSettings;
      const room = joinRoom(code, socket.id, playerSettings);
      socket.join(room.code);

      socket.emit("joinSuccess", {
        code: room.code,
        players: room.players,
      });

      io.to(room.code).emit("roomUpdate", {
        code: room.code,
        players: room.players,
      });
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("leaveRoom", cleanupRoom);
  socket.on("disconnect", cleanupRoom);

  socket.on("updatePlayerSettings", (playerSettings = {}) => {
    try {
      const room = updatePlayerSettings(socket.id, playerSettings);
      if (!room) return;

      io.to(room.code).emit("roomUpdate", {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
      });
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("toggleReady", () => {
    try {
      let roomCode = null;
      for (const [code, room] of rooms.entries()) {
        if (room.players.some(p => p.id === socket.id)) {
          roomCode = code;
          break;
        }
      }

      if (!roomCode) throw new Error("Room not found for this player");

      const { room, allReady } = toggleReady(roomCode, socket.id);

      io.to(room.code).emit("roomUpdate", {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
      });

      if (allReady) {
        io.to(room.code).emit("startCountdown", 3);

        clearTimeout(room.countdownTimer);
        room.countdownTimer = setTimeout(() => {
          if (!rooms.has(room.code)) return;

          room.gameState = initializeGameState(room.players);

          io.to(room.code).emit("gameStarted", {
            gameState: room.gameState,
          });
        }, 3000);
      } else {
        if (room.countdownTimer) {
          clearTimeout(room.countdownTimer);
          room.countdownTimer = null;
          io.to(room.code).emit("cancelCountdown");
        }
      }
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });
}

module.exports = registerRoomHandlers;
