const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const initializeSocket = require("./socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const GameLog = require('./moveLog');
const gameLogs = {};

initializeSocket(io, gameLogs);

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});
