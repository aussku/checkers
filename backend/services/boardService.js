// =============================================================================
// Board coordinate system
// =============================================================================
//
// Each color occupies two adjacent 4×4 sub-sectors of the hexagonal board.
// Sector IDs:  BD = Blue outer(Dark),  BL = Blue inner(Light)
//              GD = Green outer(Dark), GL = Green inner(Light)
//              RD = Red outer(Dark),   RL = Red inner(Light)
//
// Cell names: "{sectorId}_{coord}", e.g. "BD_1A", "BL_E3"
// Outer cells: rows 1–4 (1=outermost), cols A–D (A=left edge)
// Inner cells: rows E–H (E=innermost), cols 1–4 (1=left edge)
//
// The server works purely in cell names. Pixel coordinates do not appear here.
// The JUMP_GRAPH below was derived from geometry at build time (see
// scripts/buildJumpGraph.js) and is stored as a plain cell-name constant.
// =============================================================================

const STARTING_CELLS = {
  outerPlayable: ["1A", "3A", "2B", "1C", "3C", "2D"],
  innerPlayable: ["E1", "G1", "F2", "E3", "G3", "H2"],
};

const PLAYABLE_CELL_PATTERNS = {
  outer: ["1A", "1C", "2B", "2D", "3A", "3C", "4B", "4D"],
  inner: ["E1", "E3", "F2", "F4", "G1", "G3", "H2", "H4"],
};

const STARTING_SECTORS = {
  blue:  { outer: "BD", inner: "BL" },
  green: { outer: "GD", inner: "GL" },
  red:   { outer: "RD", inner: "RL" },
};

const CROSS_SECTOR_EDGES = [
  ["RD_4B", "BL_H4"], ["RD_4B", "BL_F4"], ["RD_4D", "BL_F4"],
  ["BD_4B", "GL_H4"], ["BD_4B", "GL_F4"], ["BD_4D", "GL_F4"],
  ["GD_4B", "RL_H4"], ["GD_4B", "RL_F4"], ["GD_4D", "RL_F4"],
  ["RD_4D", "BD_4D"], ["BD_4D", "GD_4D"], ["GD_4D", "RD_4D"],
];

// ---------------------------------------------------------------------------
// Movement graph (one-step diagonal moves)
// ---------------------------------------------------------------------------

const PLAYABLE_CELLS = new Set();

function buildMovementGraph() {
  const graph = {};

  function addEdge(a, b) {
    if (!graph[a]) graph[a] = new Set();
    if (!graph[b]) graph[b] = new Set();
    graph[a].add(b);
    graph[b].add(a);
  }

  for (const { outer, inner } of Object.values(STARTING_SECTORS)) {
    const outerPlayable = PLAYABLE_CELL_PATTERNS.outer.map(c => `${outer}_${c}`);
    const innerPlayable = PLAYABLE_CELL_PATTERNS.inner.map(c => `${inner}_${c}`);
    [...outerPlayable, ...innerPlayable].forEach(p => {
      PLAYABLE_CELLS.add(p);
      if (!graph[p]) graph[p] = new Set();
    });

    addEdge(`${outer}_1A`, `${outer}_2B`);
    addEdge(`${outer}_1C`, `${outer}_2B`);
    addEdge(`${outer}_1C`, `${outer}_2D`);
    addEdge(`${outer}_2B`, `${outer}_3A`);
    addEdge(`${outer}_2B`, `${outer}_3C`);
    addEdge(`${outer}_2D`, `${outer}_3C`);
    addEdge(`${outer}_3A`, `${outer}_4B`);
    addEdge(`${outer}_3C`, `${outer}_4B`);
    addEdge(`${outer}_3C`, `${outer}_4D`);
    addEdge(`${outer}_1C`, `${inner}_E1`);
    addEdge(`${outer}_2D`, `${inner}_E1`);
    addEdge(`${outer}_2D`, `${inner}_E3`);
    addEdge(`${outer}_4D`, `${inner}_E3`);
    addEdge(`${inner}_E1`, `${inner}_F2`);
    addEdge(`${inner}_E3`, `${inner}_F2`);
    addEdge(`${inner}_E3`, `${inner}_F4`);
    addEdge(`${inner}_F2`, `${inner}_G1`);
    addEdge(`${inner}_F2`, `${inner}_G3`);
    addEdge(`${inner}_F4`, `${inner}_G3`);
    addEdge(`${inner}_G1`, `${inner}_H2`);
    addEdge(`${inner}_G3`, `${inner}_H2`);
    addEdge(`${inner}_G3`, `${inner}_H4`);
  }

  CROSS_SECTOR_EDGES.forEach(([a, b]) => addEdge(a, b));

  return Object.fromEntries(
    Object.entries(graph).map(([k, v]) => [k, [...v].sort()])
  );
}

const MOVEMENT_GRAPH = buildMovementGraph();

// ---------------------------------------------------------------------------
// Jump graph (capture moves)
//
// Derived from MOVEMENT_GRAPH + cell coordinates at build time.
// On this board, the movement graph alone is insufficient to determine valid
// jumps: hub cells (e.g. RD_4D) sit at the crossing of multiple non-collinear
// diagonals, so "neighbor of neighbor" produces false positives. The coordinates
// resolve ambiguity by checking that the jumped-over cell lies on the straight
// line between source and landing (midpoint proximity test, threshold 50px).
//
// This constant was produced by scripts/buildJumpGraph.js — do not edit manually.
// To regenerate: node buildJumpGraph.js
// ---------------------------------------------------------------------------

// JUMP_GRAPH[from] = [{ over, to }, ...]
// 138 jump pairs across 48 cells
const JUMP_GRAPH = {
  // --- BLUE SECTOR ---
  "BD_1A": [{ over: "BD_2B", to: "BD_3C" }],
  "BD_1C": [
    { over: "BD_2B", to: "BD_3A" },
    { over: "BD_2D", to: "BL_E3" }
  ],
  "BD_2B": [
    { over: "BD_3C", to: "BD_4D" },
    { over: "BD_1C", to: "BL_E1" }
  ],
  "BD_2D": [
    { over: "BD_3C", to: "BD_4B" },
    { over: "BL_E3", to: "BL_F4" }
  ],
  "BD_3A": [
    { over: "BD_2B", to: "BD_1C" },
    { over: "BD_4B", to: "GL_F4" }
  ],
  "BD_3C": [
    { over: "BD_2B", to: "BD_1A" },
    { over: "BD_2D", to: "BL_E1" },
    { over: "BD_4B", to: "GL_H4" },
    { over: "BD_4D", to: "GD_4D" },
    { over: "BD_4D", to: "RD_4D" }
  ],
  "BD_4B": [
    { over: "BD_3C", to: "BD_2D" },
    { over: "GL_F4", to: "GL_E3" }
  ],
  "BD_4D": [
    { over: "BD_3C", to: "BD_2B" },
    { over: "BL_E3", to: "BL_F2" },
    { over: "GL_F4", to: "GL_G3" },
    { over: "RD_4D", to: "RD_3C" },
    { over: "GD_4D", to: "GD_3C" }
  ],
  "BL_E1": [
    { over: "BD_2D", to: "BD_3C" },
    { over: "BL_F2", to: "BL_G3" }
  ],
  "BL_E3": [
    { over: "BD_2D", to: "BD_1C" },
    { over: "BL_F2", to: "BL_G1" },
    { over: "BL_F4", to: "RD_4B" },
    { over: "BD_4D", to: "GL_F4" } 
  ],
  "BL_F2": [
    { over: "BL_E3", to: "BD_4D" },
    { over: "BL_G3", to: "BL_H4" }
  ],
  "BL_F4": [
    { over: "BL_E3", to: "BD_2D" },
    { over: "BL_G3", to: "BL_H2" },
    { over: "RD_4B", to: "RD_3A" },
    { over: "RD_4D", to: "RL_E3" } 
  ],
  "BL_G1": [{ over: "BL_F2", to: "BL_E3" }],
  "BL_G3": [
    { over: "BL_F2", to: "BL_E1" },
    { over: "BL_F4", to: "RD_4D" }
  ],
  "BL_H2": [{ over: "BL_G3", to: "BL_F4" }],
  "BL_H4": [
    { over: "BL_G3", to: "BL_F2" },
    { over: "RD_4B", to: "RD_3C" }
  ],

  // --- GREEN SECTOR ---
  "GD_1A": [{ over: "GD_2B", to: "GD_3C" }],
  "GD_1C": [
    { over: "GD_2B", to: "GD_3A" },
    { over: "GD_2D", to: "GL_E3" }
  ],
  "GD_2B": [
    { over: "GD_3C", to: "GD_4D" },
    { over: "GD_1C", to: "GL_E1" }
  ],
  "GD_2D": [
    { over: "GD_3C", to: "GD_4B" },
    { over: "GL_E3", to: "GL_F4" }
  ],
  "GD_3A": [
    { over: "GD_2B", to: "GD_1C" },
    { over: "GD_4B", to: "RL_F4" }
  ],
  "GD_3C": [
    { over: "GD_2B", to: "GD_1A" },
    { over: "GD_2D", to: "GL_E1" },
    { over: "GD_4B", to: "RL_H4" },
    { over: "GD_4D", to: "BD_4D" },
    { over: "GD_4D", to: "RD_4D" }
  ],
  "GD_4B": [
    { over: "GD_3C", to: "GD_2D" },
    { over: "RL_F4", to: "RL_E3" }
  ],
  "GD_4D": [
    { over: "GD_3C", to: "GD_2B" },
    { over: "GL_E3", to: "GL_F2" },
    { over: "RL_F4", to: "RL_G3" },
    { over: "BD_4D", to: "BD_3C" },
    { over: "RD_4D", to: "RD_3C" }
  ],
  "GL_E1": [
    { over: "GD_2D", to: "GD_3C" },
    { over: "GL_F2", to: "GL_G3" }
  ],
  "GL_E3": [
    { over: "GD_2D", to: "GD_1C" },
    { over: "GL_F2", to: "GL_G1" },
    { over: "GL_F4", to: "BD_4B" },
    { over: "GD_4D", to: "RL_F4" } 
  ],
  "GL_F2": [
    { over: "GL_E3", to: "GD_4D" },
    { over: "GL_G3", to: "GL_H4" }
  ],
  "GL_F4": [
    { over: "GL_E3", to: "GD_2D" },
    { over: "GL_G3", to: "GL_H2" },
    { over: "BD_4B", to: "BD_3A" },
    { over: "BD_4D", to: "BL_E3" }
  ],
  "GL_G1": [{ over: "GL_F2", to: "GL_E3" }],
  "GL_G3": [
    { over: "GL_F2", to: "GL_E1" },
    { over: "GL_F4", to: "BD_4D" }
  ],
  "GL_H2": [{ over: "GL_G3", to: "GL_F4" }],
  "GL_H4": [
    { over: "GL_G3", to: "GL_F2" },
    { over: "BD_4B", to: "BD_3C" }
  ],

  // --- RED SECTOR ---
  "RD_1A": [{ over: "RD_2B", to: "RD_3C" }],
  "RD_1C": [
    { over: "RD_2B", to: "RD_3A" },
    { over: "RD_2D", to: "RL_E3" }
  ],
  "RD_2B": [
    { over: "RD_3C", to: "RD_4D" },
    { over: "RD_1C", to: "RL_E1" }
  ],
  "RD_2D": [
    { over: "RD_3C", to: "RD_4B" },
    { over: "RL_E3", to: "RL_F4" }
  ],
  "RD_3A": [
    { over: "RD_2B", to: "RD_1C" },
    { over: "RD_4B", to: "BL_F4" }
  ],
  "RD_3C": [
    { over: "RD_2B", to: "RD_1A" },
    { over: "RD_2D", to: "RL_E1" },
    { over: "RD_4B", to: "BL_H4" },
    { over: "RD_4D", to: "BD_4D" },
    { over: "RD_4D", to: "GD_4D" }
  ],
  "RD_4B": [
    { over: "RD_3C", to: "RD_2D" },
    { over: "BL_F4", to: "BL_E3" }
  ],
  "RD_4D": [
    { over: "RD_3C", to: "RD_2B" },
    { over: "RL_E3", to: "RL_F2" },
    { over: "BL_F4", to: "BL_G3" },
    { over: "BD_4D", to: "BD_3C" },
    { over: "GD_4D", to: "GD_3C" }
  ],
  "RL_E1": [
    { over: "RD_2D", to: "RD_3C" },
    { over: "RL_F2", to: "RL_G3" }
  ],
  "RL_E3": [
    { over: "RD_2D", to: "RD_1C" },
    { over: "RL_F2", to: "RL_G1" },
    { over: "RL_F4", to: "GD_4B" },
    { over: "RD_4D", to: "BL_F4" }
  ],
  "RL_F2": [
    { over: "RL_E3", to: "RD_4D" },
    { over: "RL_G3", to: "RL_H4" }
  ],
  "RL_F4": [
    { over: "RL_E3", to: "RD_2D" },
    { over: "RL_G3", to: "RL_H2" },
    { over: "GD_4B", to: "GD_3A" },
    { over: "GD_4D", to: "GL_E3" } 
  ],
  "RL_G1": [{ over: "RL_F2", to: "RL_E3" }],
  "RL_G3": [
    { over: "RL_F2", to: "RL_E1" },
    { over: "RL_F4", to: "GD_4D" }
  ],
  "RL_H2": [{ over: "RL_G3", to: "RL_F4" }],
  "RL_H4": [
    { over: "RL_G3", to: "RL_F2" },
    { over: "GD_4B", to: "GD_3C" }
  ]
};

// ---------------------------------------------------------------------------
// Game state helpers
// ---------------------------------------------------------------------------

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
  const order = getTurnOrder(gameState);
  const next = (order.indexOf(gameState.currentTurn) + 1) % order.length;
  gameState.currentTurn = order[next];
}

// ---------------------------------------------------------------------------
// Move validation helpers
// ---------------------------------------------------------------------------

function getSimpleMoves(gameState, piece) {
  return (MOVEMENT_GRAPH[piece.position] || []).filter(
    pos => !getPieceAtPosition(gameState, pos)
  );
}

function getCaptureMoves(gameState, piece) {
  return (JUMP_GRAPH[piece.position] || []).filter(({ over, to }) => {
    const target = getPieceAtPosition(gameState, over);
    return (
      target &&
      target.color !== piece.color &&
      !getPieceAtPosition(gameState, to)
    );
  });
}

function hasAnyCapture(gameState, color) {
  return gameState.pieces
    .filter(p => p.color === color)
    .some(p => getCaptureMoves(gameState, p).length > 0);
}

// ---------------------------------------------------------------------------
// Game initialisation
// ---------------------------------------------------------------------------

function createInitialPieces() {
  const pieces = [];
  for (const [color, sectors] of Object.entries(STARTING_SECTORS)) {
    const prefix = color[0];
    const positions = [
      ...STARTING_CELLS.outerPlayable.map(c => `${sectors.outer}_${c}`),
      ...STARTING_CELLS.innerPlayable.map(c => `${sectors.inner}_${c}`),
    ];
    positions.forEach((position, i) => {
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
    captureChain: null,   // { pieceId } | null — locks multi-capture to one piece
    status: "active",
    winner: null,
  };
}

// ---------------------------------------------------------------------------
// Move application
// ---------------------------------------------------------------------------

function applyMove(gameState, playerId, pieceId, to) {
  if (!gameState)                         return { ok: false, error: "Game state missing" };
  if (gameState.status !== "active")      return { ok: false, error: "Game is not active" };
  if (gameState.currentTurn !== playerId) return { ok: false, error: "It is not your turn" };

  const piece = getPieceById(gameState, pieceId);
  if (!piece) return { ok: false, error: "Piece not found" };

  const playerColor = getPlayerColor(gameState, playerId);
  if (!playerColor)                return { ok: false, error: "Player color not found" };
  if (piece.color !== playerColor) return { ok: false, error: "You can only move your own pieces" };

  if (gameState.captureChain && gameState.captureChain.pieceId !== pieceId) {
    return { ok: false, error: "You must continue capturing with the same piece" };
  }

  if (!PLAYABLE_CELLS.has(to)) {
    return { ok: false, error: "Target cell is not a playable square" };
  }

  if (getPieceAtPosition(gameState, to)) {
    return { ok: false, error: "Destination is occupied" };
  }

  // Check for capture move first
  const captureMove = getCaptureMoves(gameState, piece).find(j => j.to === to);

  if (captureMove) {
    const from = piece.position;
    const capturedPiece = getPieceAtPosition(gameState, captureMove.over);

    gameState.pieces = gameState.pieces.filter(p => p.id !== capturedPiece.id);
    piece.position = to;

    const furtherCaptures = getCaptureMoves(gameState, piece);
    if (furtherCaptures.length > 0) {
      gameState.captureChain = { pieceId: piece.id };
    } else {
      gameState.captureChain = null;
      advanceTurn(gameState);
    }

    return { ok: true, move: { pieceId, from, to, captured: captureMove.over } };
  }

  // Simple move
  if (gameState.captureChain) {
    return { ok: false, error: "You must capture — a jump is available" };
  }

  if (hasAnyCapture(gameState, playerColor)) {
    return { ok: false, error: "You must capture — a jump is available" };
  }

  const simpleMoves = getSimpleMoves(gameState, piece);
  if (!simpleMoves.includes(to)) {
    return { ok: false, error: "Invalid move" };
  }

  const from = piece.position;
  piece.position = to;
  advanceTurn(gameState);

  return { ok: true, move: { pieceId, from, to, captured: null } };
}

module.exports = {
  STARTING_CELLS,
  PLAYABLE_CELLS,
  MOVEMENT_GRAPH,
  JUMP_GRAPH,
  createInitialPieces,
  initializeGameState,
  getPieceById,
  getPieceAtPosition,
  getPlayerColor,
  getSimpleMoves,
  getCaptureMoves,
  applyMove,
};