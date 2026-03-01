const { createRoom } = require("../services/roomService");
const rooms = require("../store/roomStore");

function registerRoomHandlers(io, socket) {
  const cleanupRoom = () => {
    for (const [code, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(code);
          console.log(`Room ${code} deleted.`);
        } else {
          io.to(code).emit("roomUpdate", { code, players: room.players });
        }
        socket.leave(code);
        break;
      }
    }
  };

  socket.on("createRoom", () => {
    try {
      const room = createRoom(socket.id);
      socket.join(room.code);
      socket.emit("roomCreated", {
        code: room.code,
        players: room.players,
      });
    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("joinRoom", (code) => {
    try {
      const room = joinRoom(code, socket.id);
      
      socket.join(room.code);

      socket.emit("joinSuccess", { 
        code: room.code, 
        players: room.players 
      });

      io.to(room.code).emit("roomUpdate", { 
        code: room.code, 
        players: room.players 
      });

    } catch (error) {
      socket.emit("errorMessage", error.message);
    }
  });

  socket.on("leaveRoom", cleanupRoom);
  socket.on("disconnect", cleanupRoom);
}

module.exports = registerRoomHandlers;