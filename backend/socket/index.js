const registerRoomHandlers = require("./roomHandlers");
const registerGameHandlers = require("./gameHandlers");

function initializeSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

  socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = initializeSocket;