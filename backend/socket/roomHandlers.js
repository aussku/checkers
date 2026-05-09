const {
  createRoom,
  joinRoom,
  toggleReady,
  updatePlayerSettings,
  updateGameSettings,
} = require("../services/roomService");
const { initializeGameState } = require("../services/boardService");
const rooms = require("../store/roomStore");

function registerRoomHandlers(io, socket, turnTimers, gameLogs, startTurnTimer, disconnectTimers) {
  socket.on("voteRematch", (accept) => {
    let roomCode = null;
    let currentRoom = null;
    
    for (const [code, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.sessionId)) {
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
        gameSettings: currentRoom.gameSettings,
      });
      return;
    }

    currentRoom.rematchVotes.add(socket.sessionId);

    io.to(roomCode).emit("rematchVoteUpdate", {
      acceptedCount: currentRoom.rematchVotes.size,
      total: currentRoom.players.length
    });

    if (currentRoom.rematchVotes.size === currentRoom.players.length && currentRoom.players.length > 0) {
      currentRoom.rematchVotes.clear();
      
      currentRoom.chatMessages = [];
      currentRoom.gameState = initializeGameState(currentRoom.players);
      
      io.to(roomCode).emit("gameStarted", {
        gameState: currentRoom.gameState,
        chatMessages: currentRoom.chatMessages,
      });
      startTurnTimer(io, roomCode, gameLogs, turnTimers);
    }
  });


  const handleLeave = () => {
    for (const [code, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.sessionId); // CHANGED

      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        
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
          if (socket.sessionId === room.hostId) { // CHANGED
            room.hostId = room.players[0].id;
          }

          io.to(code).emit("roomUpdate", { code, players: room.players, hostId: room.hostId, gameSettings: room.gameSettings });
          
          io.to(code).emit("chatMessage", {
             id: Date.now().toString(),
             playerName: "System",
             playerColor: "#888",
             text: `${player.name} abandoned the match.`,
             timestamp: new Date().toISOString()
          });
        }

        socket.leave(code);
        break;
      }
    }
  };

  socket.on("createRoom", (playerSettings = {}) => {
    try {
      const room = createRoom(socket.sessionId, playerSettings);
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
      const room = joinRoom(code, socket.sessionId, playerSettings);
      socket.join(room.code);

      socket.emit("joinSuccess", {
        code: room.code,
        players: room.players,
      });

      io.to(room.code).emit("roomUpdate", {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
        gameSettings: room.gameSettings,
      });
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("leaveRoom", () => {
    // Clear timer if they explicitly click "Leave Room" so it doesn't fire later
    if (disconnectTimers[socket.sessionId]) {
      clearTimeout(disconnectTimers[socket.sessionId]);
      delete disconnectTimers[socket.sessionId];
    }
    handleLeave();
  });

  socket.on("disconnect", () => {
    // Look to see if they are actively in a room
    let inRoomCode = null;
    let droppedPlayer = null;
    
    for (const [code, room] of rooms.entries()) {
      droppedPlayer = room.players.find(p => p.id === socket.sessionId);
      if (droppedPlayer) {
        inRoomCode = code;
        break;
      }
    }
    
  if (inRoomCode) {
      // Announce the drop to the lobby
      io.to(inRoomCode).emit("chatMessage", {
         id: Date.now().toString(),
         playerName: "System",
         playerColor: "#888",
         text: `${droppedPlayer.name} disconnected. Waiting 30s for reconnect...`,
         timestamp: new Date().toISOString()
      });

      // THE GRACE PERIOD: Give them 30 seconds to refresh the tab
      disconnectTimers[socket.sessionId] = setTimeout(() => {
        handleLeave(); // Destroy them if they don't return
        delete disconnectTimers[socket.sessionId];
      }, 30000);
    }
  });

  socket.on("updatePlayerSettings", (playerSettings = {}) => {
    try {
      const room = updatePlayerSettings(socket.sessionId, playerSettings);
      if (!room) return;

      io.to(room.code).emit("roomUpdate", {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
        gameSettings: room.gameSettings,
      });
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("toggleReady", () => {
    try {
      let roomCode = null;
      for (const [code, room] of rooms.entries()) {
        if (room.players.some(p => p.id === socket.sessionId)) {
          roomCode = code;
          break;
        }
      }

      if (!roomCode) throw new Error("Room not found for this player");

      const { room, allReady } = toggleReady(roomCode, socket.sessionId);

      io.to(room.code).emit("roomUpdate", {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
        gameSettings: room.gameSettings,
      });

      if (allReady) {
        io.to(room.code).emit("startCountdown", 3);

        clearTimeout(room.countdownTimer);
        room.countdownTimer = setTimeout(() => {
          if (!rooms.has(room.code)) return;

          room.chatMessages = [];
          room.gameState = initializeGameState(room.players);

          io.to(room.code).emit("gameStarted", {
            gameState: room.gameState,
            chatMessages: room.chatMessages,
          });
          startTurnTimer(io, room.code, gameLogs, turnTimers);
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
  socket.on("updateGameSettings", (settings = {}) => {
    try {
      let roomCode = null;
      for (const [code, room] of rooms.entries()) {
        if (room.hostId === socket.sessionId) {
          roomCode = code;
          break;
        }
      }

      if (!roomCode) throw new Error("Room not found");

      const room = updateGameSettings(roomCode, socket.sessionId, settings);

      io.to(room.code).emit("roomUpdate", {
        code: room.code,
        players: room.players,
        hostId: room.hostId,
        gameSettings: room.gameSettings,
      });
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });
}

module.exports = registerRoomHandlers;
