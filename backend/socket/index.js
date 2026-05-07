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

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    registerRoomHandlers(io, socket, turnTimers, gameLogs, startTurnTimer);
    registerGameHandlers(io, socket, gameLogs, turnTimers, startTurnTimer);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = initializeSocket;

