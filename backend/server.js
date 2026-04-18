const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const initializeSocket = require("./socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const GameLog = require('./moveLog');
const gameLogs = {};

initializeSocket(io, gameLogs);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});