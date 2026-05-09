const registerRoomHandlers = require("./roomHandlers");
const registerGameHandlers = require("./gameHandlers");
const GameLog = require("../moveLog");
const rooms = require("../store/roomStore");
const { advanceTurn } = require("../services/boardService");

function startTurnTimer(io, roomCode, gameLogs, turnTimers) {
  const room = rooms.get(roomCode);
  if (!room || room.gameState?.status !== "active") return;

  const limit = room.gameSettings?.turnTimeLimit;
  if (!limit || limit <= 0) return;

  if (turnTimers[roomCode]) {
    clearInterval(turnTimers[roomCode]);
    delete turnTimers[roomCode];
  }

  let timeLeft = limit;

  setTimeout(() => {
    io.to(roomCode).emit("turnTimerUpdate", { timeLeft });

    turnTimers[roomCode] = setInterval(() => {
      timeLeft--;
      io.to(roomCode).emit("turnTimerUpdate", { timeLeft });

      if (timeLeft <= 0) {
        clearInterval(turnTimers[roomCode]);
        delete turnTimers[roomCode];

        const currentPlayerId = room.gameState?.currentTurn;
        const currentPlayer = room.players.find(p => p.id === currentPlayerId);
        if (currentPlayer && room.gameState?.status === "active") {
          if (!gameLogs[roomCode]) gameLogs[roomCode] = new GameLog();
          gameLogs[roomCode].addTurnSkip(currentPlayer.name, { reason: 'time limit exceeded' }, currentPlayer.color);
          gameLogs[roomCode].broadcast(io, roomCode);

          advanceTurn(room.gameState);
          io.to(roomCode).emit("gameState", room.gameState);
          io.to(roomCode).emit("turnSkipped");

          startTurnTimer(io, roomCode, gameLogs, turnTimers);
        }
      }
    }, 1000);
  }, 1000);
}

function initializeSocket(io, gameLogs) {
  const turnTimers = {};
  const disconnectTimers = {}; // Track players during their grace period

  // Middleware: Force sockets to identify with their sessionId
  io.use((socket, next) => {
    const sessionId = socket.handshake.auth.sessionId;
    if (!sessionId) {
      return next(new Error("Authentication error: No session ID"));
    }
    socket.sessionId = sessionId; // Attach it to the socket object
    next();
  });

  io.on("connection", (socket) => {
    console.log("User connected with Session:", socket.sessionId);

    // --- AUTOMATIC RECONNECT LOGIC ---
    for (const [code, room] of rooms.entries()) {
      const player = room.players.find(p => p.id === socket.sessionId);
      if (player) {
        socket.join(code);
        console.log(`Player ${player.name} reconnected to room ${code}`);

        // If they had a destruction timer running, cancel it!
        if (disconnectTimers[socket.sessionId]) {
          clearTimeout(disconnectTimers[socket.sessionId]);
          delete disconnectTimers[socket.sessionId];
          
          io.to(code).emit("chatMessage", {
            id: Date.now().toString(),
            playerName: "System",
            playerColor: "#888",
            text: `${player.name} reconnected.`,
            timestamp: new Date().toISOString()
          });
        }

        // 1. Send joinSuccess to set gameState.roomCode on the client
        socket.emit("joinSuccess", {
          code,
          players: room.players,
        });

        // 2. Send roomUpdate to restore host status and settings
        socket.emit("roomUpdate", {
          code,
          players: room.players,
          hostId: room.hostId,
          gameSettings: room.gameSettings,
        });

        // 3. Restore their exact board view
        if (room.gameState) {
          socket.emit("gameStarted", {
            gameState: room.gameState,
            chatMessages: room.chatMessages,
          });
        }
        break; // Found their room, stop looking
      }
    }

    // Pass disconnectTimers down so roomHandlers can use them
    registerRoomHandlers(io, socket, turnTimers, gameLogs, startTurnTimer, disconnectTimers);
    registerGameHandlers(io, socket, gameLogs, turnTimers, startTurnTimer);
  });
}

module.exports = initializeSocket;

