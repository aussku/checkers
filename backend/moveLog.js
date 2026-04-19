const LogEvent = require('./logEvent');

class GameLog {
  constructor() {
    this.events = [];
  }

  // Bendras metodas įvykiui pridėti
  addEvent(type, player, details, playerColor = null, timestamp = new Date()) {
    const event = new LogEvent(type, player, details, timestamp, playerColor);
    this.events.push(event);
  }

  // Specifiniai metodai kiekvienam tipui (pagal aprašymą)
  addMove(player, details, playerColor) { // details: { pieceId, from, to }
    this.addEvent('move', player, details, playerColor);
  }

  addCapture(player, details, playerColor) { // details: { pieceId, capturedPiece, position }
    this.addEvent('capture', player, details, playerColor);
  }

  addPromotion(player, details, playerColor) { // details: { pieceId, fromType, toType, position }
    this.addEvent('promotion', player, details, playerColor);
  }

  addTurnSkip(player, details, playerColor) { // details: { reason? }
    this.addEvent('turnSkip', player, details, playerColor);
  }

  addElimination(player, details, playerColor) { // details: { eliminatedPlayer, reason }
    this.addEvent('elimination', player, details, playerColor);
  }

  getEvents() {
    return this.events;
  }

  // Išsaugoti į failą arba DB
  saveToFile(filename = 'gameLog.json') {
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(this.events.map(e => e.toJSON()), null, 2));
  }

  // Broadcastinti į klientus (naudojant socket.io)
  broadcast(io, roomCode) {
    console.log("Broadcasting gameLogUpdate for room", roomCode, "events:", this.events.length); // Debug log
    io.to(roomCode).emit('gameLogUpdate', this.events.map(e => e.toJSON()));
  }
}

module.exports = GameLog;