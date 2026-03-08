const rooms = require("../store/roomStore");

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
}

module.exports = registerGameHandlers;