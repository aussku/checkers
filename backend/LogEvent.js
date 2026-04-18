/**
 * Log event structure for various game events.
 */
class LogEvent {
  constructor(type, player, details, timestamp = new Date(), playerColor = null) {
    this.type = type; // 'move', 'capture', 'promotion', 'turnSkip', 'elimination'
    this.player = player; // Acting player (e.g., player name or ID)
    this.details = details; // Relevant details (e.g., { from: 'A1', to: 'B2' } for move)
    this.timestamp = timestamp; // Date object
    this.playerColor = playerColor; // Player color (e.g., 'white', 'black')
  }

  // Method to convert to string for logging
  toString() {
    return `[${this.timestamp.toISOString()}] ${this.type.toUpperCase()} by ${this.player}: ${JSON.stringify(this.details)}`;
  }

  // Method to serialize for broadcasting and storage
  toJSON() {
    return {
      type: this.type,
      player: this.player,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      playerColor: this.playerColor
    };
  }
}

module.exports = LogEvent;