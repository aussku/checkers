const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const initializeSocket = require("./socket");
const userService = require("./services/userService");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/register", (req, res) => {
  try {
    const user = userService.createUser(req.body || {});
    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof userService.ValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (error instanceof userService.DuplicateError) {
      return res.status(409).json({ success: false, error: error.message });
    }

    console.error("Registration error:", error);
    return res.status(500).json({ success: false, error: "Unable to register user." });
  }
});

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
