const registerRoomHandlers = require("./roomHandlers");
const registerGameHandlers = require("./gameHandlers");
const GameLog = require("../moveLog");

function initializeSocket(io, gameLogs) {
  const turnTimers = {}; // { roomCode: timeoutId }

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket, gameLogs, turnTimers);

  socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = initializeSocket;