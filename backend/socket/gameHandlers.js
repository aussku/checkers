const rooms = require("../store/roomStore");
const { applyMove, advanceTurn, getLegalMovesForPiece } = require("../services/boardService");
const GameLog = require("../moveLog");

function registerGameHandlers(io, socket, gameLogs, turnTimers) {
  socket.on("sendChatMessage", ({ text } = {}) => {
    try {
      const trimmedText = typeof text === "string" ? text.trim() : "";
      if (!trimmedText) return;

      for (const [roomCode, room] of rooms.entries()) {
        const player = room.players.find(p => p.id === socket.id);
        if (!player) continue;

        const message = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          text: trimmedText.slice(0, 240),
          timestamp: new Date().toISOString(),
        };

        if (!Array.isArray(room.chatMessages)) {
          room.chatMessages = [];
        }

        room.chatMessages.push(message);
        io.to(roomCode).emit("chatMessage", message);
        return;
      }
    } catch (error) {
      console.error("sendChatMessage error:", error);
      socket.emit("errorMessage", "Unable to send chat message.");
    }
  });

  socket.on("debugEndGame", (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState || room.gameState.status === "finished") return;

    console.log(`[DEBUG] Force ending game for room ${roomCode}`);

    // Force game over
    room.gameState.status = "finished";
    
    // Generate mock rankings from the current players
    room.gameState.rankings = room.players.map((p, index) => ({
      playerId: p.id,
      color: p.color,
      place: index + 1
    }));
    
    room.gameState.winner = room.gameState.rankings[0].playerId;
    room.gameState.currentTurn = null;
    room.gameState.captureChain = null;

    // Clear any active turn timers
    if (turnTimers[roomCode]) {
      clearTimeout(turnTimers[roomCode]);
      delete turnTimers[roomCode];
    }

    // Broadcast the finished state to all players
    io.to(roomCode).emit("gameState", room.gameState);
  });

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

  socket.on("requestValidMoves", ({ roomCode, pieceId } = {}) => {
    try {
      const room = rooms.get(roomCode);
      if (!room?.gameState || !pieceId) {
        socket.emit("validMoves", { pieceId, moves: [] });
        return;
      }

      const moves = getLegalMovesForPiece(room.gameState, socket.id, pieceId);
      socket.emit("validMoves", { pieceId, moves });
    } catch (error) {
      console.error("requestValidMoves error:", error);
      socket.emit("validMoves", { pieceId, moves: [] });
    }
  });

  socket.on("makeMove", ({ roomCode, pieceId, to }) => {
    try {
      const room = rooms.get(roomCode);
      const result = applyMove(room.gameState, socket.id, pieceId, to);
      
      if (!result.ok) {
        socket.emit("invalidMove", { error: result.error });
        return;
      }

      // Clear timer on successful move
      if (turnTimers[roomCode]) {
        clearTimeout(turnTimers[roomCode]);
        delete turnTimers[roomCode];
      }

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        if (!gameLogs[roomCode]) gameLogs[roomCode] = new GameLog();

        // Log move
        const moveDetails = {
          pieceId,
          from: result.move.from,
          to: result.move.to,
          captured: result.move.captured || null
        };
        gameLogs[roomCode].addMove(player.name, moveDetails, player.color);

        // Log capture if happened
        if (result.move.captured) {
          gameLogs[roomCode].addCapture(player.name, {
            pieceId,
            capturedPiece: result.move.captured,
            position: result.move.to
          }, player.color);
        }

        // Log promotion if happened
        if (result.move.promoted) {
          gameLogs[roomCode].addPromotion(player.name, {
            pieceId,
            fromType: 'pawn',
            toType: 'king',
            position: result.move.to
          }, player.color);
        }

        // Log eliminations if happened
        if (result.eliminated && result.eliminated.length > 0) {
          result.eliminated.forEach(eliminatedRecord => {
            const eliminatedPlayer = room.players.find(p => p.id === eliminatedRecord.playerId);
            if (eliminatedPlayer) {
              gameLogs[roomCode].addElimination(player.name, {
                eliminatedPlayer: eliminatedPlayer.name,
                reason: 'no pieces left'
              }, player.color);
            }
          });
        }

        console.log("Logged move event", roomCode, player.name, moveDetails);
        gameLogs[roomCode].broadcast(io, roomCode);
      }

      // Start timer for next player
      startTurnTimer(io, roomCode, gameLogs, turnTimers);

      io.to(roomCode).emit("gameState", room.gameState);
    } catch (error) {
      console.error("makeMove error:", error);
      socket.emit("moveError", { error: error.message });
    }
  });

  // Helper function to start timer
  function startTurnTimer(io, roomCode, gameLogs, turnTimers) {
    const room = rooms.get(roomCode);
    if (!room || room.gameState.status !== "active") return;

    turnTimers[roomCode] = setTimeout(() => {
      // Skip turn
      const currentPlayerId = room.gameState.currentTurn;
      const currentPlayer = room.players.find(p => p.id === currentPlayerId);
      if (currentPlayer) {
        // Log turn skip
        if (!gameLogs[roomCode]) gameLogs[roomCode] = new GameLog();
        gameLogs[roomCode].addTurnSkip(currentPlayer.name, { reason: 'time limit exceeded' }, currentPlayer.color);
        gameLogs[roomCode].broadcast(io, roomCode);

        // Advance turn
        advanceTurn(room.gameState);
        io.to(roomCode).emit("gameState", room.gameState);

        // Start timer for next player
        startTurnTimer(io, roomCode, gameLogs, turnTimers);
      }
    }, 30000); // 30 seconds
  }
}

module.exports = registerGameHandlers;
