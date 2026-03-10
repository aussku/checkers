const STARTING_CELLS = {
  dark:  ["1A", "3A", "2B", "1C", "3C", "2D"],
  light: ["E1", "G1", "F2", "E3", "G3", "H2"],
};

const COLOR_SECTORS = {
  blue:  { first: "dark",  second: "light" },
  green: { first: "light", second: "dark"  },
  red:   { first: "dark",  second: "light" },
};

function createInitialPieces() {
  const pieces = [];

  for (const [color, sectors] of Object.entries(COLOR_SECTORS)) {
    const prefix = color[0]; // "b", "g", "r"
    const firstCells  = STARTING_CELLS[sectors.first].map(c => `${c}_${color}`);
    const secondCells = STARTING_CELLS[sectors.second].map(c => `${c}_${color}`);

    [...firstCells, ...secondCells].forEach((position, i) => {
      pieces.push({ id: `${prefix}${i + 1}`, color, position, king: false });
    });
  }

  return pieces;
}

function initializeGameState(players) {
  const colorOrder = ["blue", "green", "red"];
  const colorAssignments = {};
  players.forEach((player, index) => {
    colorAssignments[player.id] = colorOrder[index];
  });

  return {
    pieces: createInitialPieces(),
    colorAssignments,
    currentTurn: players[0].id,
    status: "active",
    winner: null,
  };
}

function getPieceById(gameState, pieceId) {
  return gameState.pieces.find(p => p.id === pieceId) || null;
}

function getPieceAtPosition(gameState, position) {
  return gameState.pieces.find(p => p.position === position) || null;
}

function getPlayerColor(gameState, playerId) {
  return gameState.colorAssignments[playerId] || null;
}

function getTurnOrder(gameState) {
  return Object.keys(gameState.colorAssignments);
}

function advanceTurn(gameState) {
  const turnOrder = getTurnOrder(gameState);
  const currentIndex = turnOrder.indexOf(gameState.currentTurn);
  const nextIndex = (currentIndex + 1) % turnOrder.length;
  gameState.currentTurn = turnOrder[nextIndex];
}

function validateMove(gameState, piece, to) {
  if (!piece) {
    return { ok: false, error: "Piece not found" };
  }

  if (piece.position === to) {
    return { ok: false, error: "You must move to a different cell" };
  }

  const occupyingPiece = getPieceAtPosition(gameState, to);
  if (occupyingPiece) {
    return { ok: false, error: "Destination is occupied" };
  }

  // TODO: REAL 3-player checkers validation goes here:
  // - whether 'to' is adjacent / reachable
  // - move direction by color
  // - capture rules
  // - king rules
  // - mandatory capture
  // - multi-capture

  return { ok: true };
}

function applyMove(gameState, playerId, pieceId, to) {
  console.log("applyMove called with:", { playerId, pieceId, to });

  if (!gameState) {
    return { ok: false, error: "Game state missing" };
  }

  if (gameState.status !== "active") {
    return { ok: false, error: "Game is not active" };
  }

  if (gameState.currentTurn !== playerId) {
    return { ok: false, error: "It is not your turn" };
  }

  const piece = getPieceById(gameState, pieceId);
  console.log("Found piece:", piece);

  if (!piece) {
    return { ok: false, error: "Piece not found" };
  }

  const playerColor = getPlayerColor(gameState, playerId);
  console.log("Player color:", playerColor);

  if (!playerColor) {
    return { ok: false, error: "Player color not found" };
  }

  if (piece.color !== playerColor) {
    return { ok: false, error: "You can only move your own pieces" };
  }

  const validation = validateMove(gameState, piece, to);
  console.log("Validation result:", validation);

  if (!validation.ok) {
    return validation;
  }

  const from = piece.position;
  piece.position = to;

  advanceTurn(gameState);

  console.log("Move applied:", { pieceId, from, to, nextTurn: gameState.currentTurn });

  return {
    ok: true,
    move: { pieceId, from, to }
  };
}

module.exports = {
  STARTING_CELLS,
  createInitialPieces,
  initializeGameState,
  applyMove,
};