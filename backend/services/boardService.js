const STARTING_CELLS = {
  dark:  ["1A", "3A", "2B", "1C", "3C", "2D"],
  light: ["E1", "G1", "F2", "E3", "G3", "H2"],
};

const COLOR_SECTORS = {
  blue:  { first: "dark",  second: "light" },
  green: { first: "light", second: "dark"  },
  red:   { first: "dark",  second: "light" },
};

const BOARD_POSITIONS = {
    // RED dark (rot 0°)
  "4D_red": { x: 460.8, y: 568.0 }, "4C_red": { x: 389.3, y: 604.5 },
  "3D_red": { x: 465.3, y: 650.0 }, "4B_red": { x: 322.8, y: 638.0 },
  "3C_red": { x: 400.8, y: 675.3 }, "2D_red": { x: 469.0, y: 725.5 },
  "4A_red": { x: 257.3, y: 671.0 }, "3B_red": { x: 341.8, y: 696.8 },
  "2C_red": { x: 410.3, y: 739.8 }, "1D_red": { x: 471.8, y: 796.8 },
  "3A_red": { x: 282.5, y: 720.0 }, "2B_red": { x: 356.8, y: 752.3 },
  "1C_red": { x: 417.8, y: 800.5 }, "2A_red": { x: 303.8, y: 766.0 },
  "1B_red": { x: 368.3, y: 804.3 }, "1A_red": { x: 321.3, y: 808.5 },
  // BLUE light (rot 60°)
  "E4_blue": { x: 421.5, y: 500.0 }, "E3_blue": { x: 354.1, y: 456.3 },
  "F4_blue": { x: 352.7, y: 544.9 }, "E2_blue": { x: 291.9, y: 415.5 },
  "F3_blue": { x: 298.6, y: 501.7 }, "G4_blue": { x: 289.2, y: 585.9 },
  "E1_blue": { x: 230.5, y: 375.3 }, "F2_blue": { x: 250.5, y: 461.3 },
  "G3_blue": { x: 247.5, y: 542.1 }, "H4_blue": { x: 228.9, y: 623.9 },
  "F1_blue": { x: 200.7, y: 421.6 }, "G2_blue": { x: 209.9, y: 502.1 },
  "H3_blue": { x: 198.6, y: 579.0 }, "G1_blue": { x: 171.5, y: 463.0 },
  "H2_blue": { x: 170.6, y: 538.0 }, "H1_blue": { x: 143.5, y: 499.4 },
  // BLUE dark (rot 120°)
  "4D_blue": { x: 460.7, y: 432.0 }, "4C_blue": { x: 464.9, y: 351.8 },
  "3D_blue": { x: 387.5, y: 394.9 }, "4B_blue": { x: 469.1, y: 277.5 },
  "3C_blue": { x: 397.9, y: 326.4 }, "2D_blue": { x: 320.2, y: 360.4 },
  "4A_blue": { x: 473.3, y: 204.3 }, "3B_blue": { x: 408.7, y: 264.6 },
  "2C_blue": { x: 337.2, y: 302.4 }, "1D_blue": { x: 257.1, y: 327.2 },
  "3A_blue": { x: 418.2, y: 201.6 }, "2B_blue": { x: 353.2, y: 249.8 },
  "1C_blue": { x: 280.9, y: 278.5 }, "2A_blue": { x: 367.8, y: 197.0 },
  "1B_blue": { x: 302.4, y: 233.8 }, "1A_blue": { x: 322.2, y: 190.9 },
  // GREEN light (rot 180°)
  "E4_green": { x: 539.3, y: 432.0 }, "E3_green": { x: 610.8, y: 395.5 },
  "F4_green": { x: 534.8, y: 350.0 }, "E2_green": { x: 677.3, y: 362.0 },
  "F3_green": { x: 599.3, y: 324.8 }, "G4_green": { x: 531.0, y: 274.5 },
  "E1_green": { x: 742.8, y: 329.0 }, "F2_green": { x: 658.3, y: 303.3 },
  "G3_green": { x: 589.8, y: 260.3 }, "H4_green": { x: 528.3, y: 203.3 },
  "F1_green": { x: 717.5, y: 280.0 }, "G2_green": { x: 643.3, y: 247.8 },
  "H3_green": { x: 582.3, y: 199.5 }, "G1_green": { x: 696.3, y: 234.0 },
  "H2_green": { x: 631.8, y: 195.8 }, "H1_green": { x: 678.8, y: 191.5 },
  // GREEN dark (rot 240°)
  "4D_green": { x: 578.5, y: 500.0 }, "4C_green": { x: 645.9, y: 543.7 },
  "3D_green": { x: 647.3, y: 455.1 }, "4B_green": { x: 708.1, y: 584.5 },
  "3C_green": { x: 701.4, y: 498.3 }, "2D_green": { x: 710.8, y: 414.1 },
  "4A_green": { x: 769.5, y: 624.7 }, "3B_green": { x: 749.5, y: 538.7 },
  "2C_green": { x: 752.5, y: 457.9 }, "1D_green": { x: 771.1, y: 376.1 },
  "3A_green": { x: 799.3, y: 578.4 }, "2B_green": { x: 790.1, y: 497.9 },
  "1C_green": { x: 801.4, y: 421.0 }, "2A_green": { x: 828.5, y: 537.0 },
  "1B_green": { x: 829.4, y: 462.0 }, "1A_green": { x: 856.5, y: 500.6 },
  // RED light (rot 300°)
  "E4_red": { x: 539.3, y: 568.0 }, "E3_red": { x: 535.1, y: 648.2 },
  "F4_red": { x: 612.5, y: 605.1 }, "E2_red": { x: 530.9, y: 722.5 },
  "F3_red": { x: 602.1, y: 673.6 }, "G4_red": { x: 679.8, y: 639.6 },
  "E1_red": { x: 526.7, y: 795.7 }, "F2_red": { x: 591.3, y: 735.4 },
  "G3_red": { x: 662.8, y: 697.6 }, "H4_red": { x: 742.9, y: 672.8 },
  "F1_red": { x: 581.8, y: 798.4 }, "G2_red": { x: 646.8, y: 750.2 },
  "H3_red": { x: 719.1, y: 721.5 }, "G1_red": { x: 632.2, y: 803.0 },
  "H2_red": { x: 697.6, y: 766.2 }, "H1_red": { x: 677.8, y: 809.1 },
};

const NORMAL_MOVE_MAP = {
  // BLUE
  "1A_blue": ["2B_blue"],
  "1B_blue": ["2A_blue", "2C_blue"],
  "1C_blue": ["2B_blue", "2D_blue"],
  "1D_blue": ["2C_blue"],

  "2A_blue": ["3B_blue"],
  "2B_blue": ["3A_blue", "3C_blue"],
  "2C_blue": ["3B_blue", "3D_blue"],
  "2D_blue": ["3C_blue"],

  "3A_blue": ["4B_blue"],
  "3B_blue": ["4A_blue", "4C_blue"],
  "3C_blue": ["4B_blue", "4D_blue"],
  "3D_blue": ["4C_blue"],

  "E1_blue": ["F2_blue"],
  "F1_blue": ["E2_blue", "G2_blue"],
  "G1_blue": ["F2_blue", "H2_blue"],
  "H1_blue": ["G2_blue"],

  "E2_blue": ["F3_blue"],
  "F2_blue": ["E3_blue", "G3_blue"],
  "G2_blue": ["F3_blue", "H3_blue"],
  "H2_blue": ["G3_blue"],

  "E3_blue": ["F4_blue", "D4_blue"],
  "F3_blue": ["E4_blue", "G4_blue"],
  "G3_blue": ["F4_blue", "H4_blue"],
  "H3_blue": ["G4_blue"],

  "E4_blue": [],
  "F4_blue": [],
  "G4_blue": [],
  "H4_blue": [],

  // GREEN
  "1A_green": ["2B_green"],
  "1B_green": ["2A_green", "2C_green"],
  "1C_green": ["2B_green", "2D_green"],
  "1D_green": ["2C_green"],

  "2A_green": ["3B_green"],
  "2B_green": ["3A_green", "3C_green"],
  "2C_green": ["3B_green", "3D_green"],
  "2D_green": ["3C_green"],

  "3A_green": ["4B_green"],
  "3B_green": ["4A_green", "4C_green"],
  "3C_green": ["4B_green", "4D_green"],
  "3D_green": ["4C_green"],

  "E1_green": ["F2_green"],
  "F1_green": ["E2_green", "G2_green"],
  "G1_green": ["F2_green", "H2_green"],
  "H1_green": ["G2_green"],

  "E2_green": ["F3_green"],
  "F2_green": ["E3_green", "G3_green"],
  "G2_green": ["F3_green", "H3_green"],
  "H2_green": ["G3_green"],

  "E3_green": ["F4_green", "D4_green"],
  "F3_green": ["E4_green", "G4_green"],
  "G3_green": ["F4_green", "H4_green"],
  "H3_green": ["G4_green"],

  "E4_green": [],
  "F4_green": [],
  "G4_green": [],
  "H4_green": [],

  // RED
  "1A_red": ["2B_red"],
  "1B_red": ["2A_red", "2C_red"],
  "1C_red": ["2B_red", "2D_red"],
  "1D_red": ["2C_red"],

  "2A_red": ["3B_red"],
  "2B_red": ["3A_red", "3C_red"],
  "2C_red": ["3B_red", "3D_red"],
  "2D_red": ["3C_red"],

  "3A_red": ["4B_red"],
  "3B_red": ["4A_red", "4C_red"],
  "3C_red": ["4B_red", "4D_red"],
  "3D_red": ["4C_red"],

  "E1_red": ["F2_red"],
  "F1_red": ["E2_red", "G2_red"],
  "G1_red": ["F2_red", "H2_red"],
  "H1_red": ["G2_red"],

  "E2_red": ["F3_red"],
  "F2_red": ["E3_red", "G3_red"],
  "G2_red": ["F3_red", "H3_red"],
  "H2_red": ["G3_red"],

  "E3_red": ["F4_red", "D4_red"],
  "F3_red": ["E4_red", "G4_red"],
  "G3_red": ["F4_red", "H4_red"],
  "H3_red": ["G4_red"],

  "E4_red": [],
  "F4_red": [],
  "G4_red": [],
  "H4_red": [],
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

function getValidSimpleMovesForNormalPiece(piece) {
  return NORMAL_MOVE_MAP[piece.position] || [];
}

function validateMove(gameState, piece, to) {
  if (!piece) {
    return { ok: false, error: "Piece not found" };
  }

  if (piece.position === to) {
    return { ok: false, error: "You must move to a different cell" };
  }

  if (!BOARD_POSITIONS[to]) {
    return { ok: false, error: "Target cell is outside the board" };
  }

  // pieces stay in their own color coordinate space
  if (!to.endsWith(`_${piece.color}`)) {
    return { ok: false, error: "Target cell is outside this piece's board" };
  }

  const occupyingPiece = getPieceAtPosition(gameState, to);
  if (occupyingPiece) {
    return { ok: false, error: "Destination is occupied" };
  }

  // For now, only normal one-step adjacent movement is implemented
  if (piece.king) {
    return { ok: false, error: "King movement is not implemented yet" };
  }

  const validMoves = getValidSimpleMovesForNormalPiece(piece);
  console.log("Valid moves for", piece.id, piece.position, "=>", validMoves);
  if (!validMoves.includes(to)) {
    return { ok: false, error: "Invalid move for a normal piece" };
  }

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
    return {
      ok: false,
      error: validation.error,
      pieceId: piece.id,
      from: piece.position,
      to,
    };
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