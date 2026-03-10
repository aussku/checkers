const rooms = require("../store/roomStore");
const { applyMove } = require("../services/boardService");

function registerGameHandlers(io, socket) {
  socket.on("requestGameState", () => {
    for (const [code, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        if (room.gameState) {
          socket.emit("gameState", room.gameState);
        }
        break;
      }
    }
  });

socket.on("makeMove", ({ roomCode, pieceId, to }) => {
  try {
    console.log("makeMove received:", { roomCode, pieceId, to, playerId: socket.id });

    const room = rooms.get(roomCode);
    if (!room) throw new Error("Room not found");
    if (!room.gameState) throw new Error("Game has not started");

    const result = applyMove(room.gameState, socket.id, pieceId, to);
    console.log("applyMove result:", result);

    if (!result.ok) {
      socket.emit("errorMessage", result.error);
      return;
    }

    console.log("Broadcasting updated gameState");
    io.to(roomCode).emit("gameState", room.gameState);
  } catch (error) {
    console.error("makeMove error:", error);
    socket.emit("errorMessage", error.message);
  }
});
}

module.exports = registerGameHandlers;