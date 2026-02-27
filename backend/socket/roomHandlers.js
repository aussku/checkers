const { createRoom } = require("../services/roomService");

function registerRoomHandlers(io, socket) {

  socket.on("createRoom", () => {
    try {
      const room = createRoom(socket.id);

      socket.join(room.code);

      socket.emit("roomCreated", {
        code: room.code,
        players: room.players.length,
      });

    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

}

module.exports = registerRoomHandlers;