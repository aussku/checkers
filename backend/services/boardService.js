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

const FORWARD_DIRECTIONS = {
  blue:  ["N", "NE", "NW"],
  green: ["S", "SE", "NE"], // Moving toward Red/Blue
  red:   ["S", "SW", "NW"]  // Moving toward Green/Blue
};

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
  // Hub-to-inner diagonal connections: the *D hub cells are collinear with
  // the opposing color's *F4 inner cells (confirmed by JUMP_GRAPH geometry).
  ["RD_4D", "BL_F4"], ["BD_4D", "GL_F4"], ["GD_4D", "RL_F4"],
];

const PROMOTION_ZONES = {
  // Blue promotes on the far Row 1 edges of Green and Red
  blue: [
    "GD_1A", "GD_1C", "GL_E1", "GL_G1", 
    "RD_1A", "RD_1C", "RL_E1", "RL_G1"
  ],
  // Green promotes on the far Row 1 edges of Blue and Red
  green: [
    "BD_1A", "BD_1C", "BL_E1", "BL_G1", 
    "RD_1A", "RD_1C", "RL_E1", "RL_G1"
  ],
  // Red promotes on the far Row 1 edges of Blue and Green
  red: [
    "BD_1A", "BD_1C", "BL_E1", "BL_G1", 
    "GD_1A", "GD_1C", "GL_E1", "GL_G1"
  ]
};

// ---------------------------------------------------------------------------
// Movement graph (one-step diagonal moves)
// ---------------------------------------------------------------------------

// FIX (Bug 4): PLAYABLE_CELLS is populated after MOVEMENT_GRAPH is built below.
const PLAYABLE_CELLS = new Set();

function buildMovementGraph() {
  const graph = {};

  function addEdge(a, b) {
    if (!graph[a]) graph[a] = new Set();
    if (!graph[b]) graph[b] = new Set();
    graph[a].add(b);
    graph[b].add(a);
  }

  const sectors = [
    { out: 'BD', inn: 'BL' },
    { out: 'GD', inn: 'GL' },
    { out: 'RD', inn: 'RL' }
  ];

  sectors.forEach(({ out, inn }) => {
    // Outer Diamond
    addEdge(`${out}_1A`, `${out}_2B`);
    addEdge(`${out}_1C`, `${out}_2B`);
    addEdge(`${out}_1C`, `${out}_2D`);
    addEdge(`${out}_2B`, `${out}_3A`);
    addEdge(`${out}_2B`, `${out}_3C`);
    addEdge(`${out}_2D`, `${out}_3C`);
    addEdge(`${out}_3A`, `${out}_4B`);
    addEdge(`${out}_3C`, `${out}_4B`);
    addEdge(`${out}_3C`, `${out}_4D`);

    // Inner Diamond
    addEdge(`${inn}_E1`, `${inn}_F2`);
    addEdge(`${inn}_E3`, `${inn}_F2`);
    addEdge(`${inn}_E3`, `${inn}_F4`);
    addEdge(`${inn}_F2`, `${inn}_G1`);
    addEdge(`${inn}_F2`, `${inn}_G3`);
    addEdge(`${inn}_F4`, `${inn}_G3`);
    addEdge(`${inn}_G1`, `${inn}_H2`);
    addEdge(`${inn}_G3`, `${inn}_H2`);
    addEdge(`${inn}_G3`, `${inn}_H4`);

    // THE CRITICAL BRIDGES
    addEdge(`${out}_1C`, `${inn}_E1`);
    addEdge(`${out}_2D`, `${inn}_E1`);
    addEdge(`${out}_2D`, `${inn}_E3`);
    addEdge(`${out}_4D`, `${inn}_E3`);
  });

  // Center Hub Connections (triangular hub between the three color zones)
  addEdge("RD_4D", "BD_4D"); 
  addEdge("BD_4D", "GD_4D"); 
  addEdge("GD_4D", "RD_4D");

  // Hub-to-inner diagonal connections.
  // RL_E3, RD_4D, and BL_F4 are collinear (and likewise for the other two
  // color pairs), so each hub cell is a direct neighbor of the opposing
  // color's F4 inner cell. These were missing, causing moves like
  // r10@RD_4D -> BL_F4 to be rejected as "Invalid move path".
  addEdge("RD_4D", "BL_F4");
  addEdge("BD_4D", "GL_F4");
  addEdge("GD_4D", "RL_F4");

  // Cross-sector outer edges
  addEdge("RD_4B", "BL_H4");
  addEdge("RD_4B", "BL_F4");
  addEdge("BD_4B", "GL_H4");
  addEdge("BD_4B", "GL_F4");
  addEdge("GD_4B", "RL_H4");
  addEdge("GD_4B", "RL_F4");

  // Convert Sets to Arrays for final graph
  return Object.fromEntries(
    Object.entries(graph).map(([k, v]) => [k, Array.from(v)])
  );
}

const MOVEMENT_GRAPH = buildMovementGraph();

// FIX (Bug 4): Populate PLAYABLE_CELLS from the built graph.
Object.keys(MOVEMENT_GRAPH).forEach(cell => PLAYABLE_CELLS.add(cell));

// ---------------------------------------------------------------------------
// Forward-direction tables (BFS from each color's promotion zones)
//
// isForwardMove previously used JUMP_GRAPH to infer direction, but that fails
// for terminal edges (e.g. G1<->H2 in each inner sector) which are real
// movement edges that no jump ever crosses. BFS from promotion zones gives
// a distance-to-goal for every cell; a step is "forward" iff it decreases
// that distance. Computed once at module load, O(cells) time and space.
// ---------------------------------------------------------------------------

function buildForwardDistances(color) {
  const dist = {};
  const queue = [...PROMOTION_ZONES[color]];
  queue.forEach(c => { dist[c] = 0; });
  let i = 0;
  while (i < queue.length) {
    const curr = queue[i++];
    for (const nb of (MOVEMENT_GRAPH[curr] || [])) {
      if (dist[nb] === undefined) {
        dist[nb] = dist[curr] + 1;
        queue.push(nb);
      }
    }
  }
  return dist;
}

const FORWARD_DISTANCES = {
  blue:  buildForwardDistances("blue"),
  green: buildForwardDistances("green"),
  red:   buildForwardDistances("red"),
};

// ---------------------------------------------------------------------------
// Jump graph (capture moves)
// ---------------------------------------------------------------------------

// JUMP_GRAPH[from] = [{ over, to }, ...]
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

function ensureGameStateMeta(gameState) {
  if (!gameState.pieceCounts) {
    gameState.pieceCounts = countPiecesByColor(gameState.pieces || []);
  }
  if (!gameState.eliminatedPlayers) {
    gameState.eliminatedPlayers = [];
  }
  if (!gameState.rankings) {
    gameState.rankings = [];
  }
}

function getPlayerIdByColor(gameState, color) {
  return Object.entries(gameState.colorAssignments).find(([, assignedColor]) => assignedColor === color)?.[0] || null;
}

function countPiecesByColor(pieces) {
  return {
    blue: pieces.filter(piece => piece.color === "blue").length,
    green: pieces.filter(piece => piece.color === "green").length,
    red: pieces.filter(piece => piece.color === "red").length,
  };
}

function isPlayerEliminated(gameState, playerId) {
  return gameState.eliminatedPlayers.some(player => player.playerId === playerId);
}

function getActivePlayerIds(gameState) {
  return getTurnOrder(gameState).filter(playerId => !isPlayerEliminated(gameState, playerId));
}

function advanceTurn(gameState) {
  const order = getActivePlayerIds(gameState);
  if (order.length === 0) {
    gameState.currentTurn = null;
    return;
  }

  const currentIndex = order.indexOf(gameState.currentTurn);
  const next = currentIndex === -1 ? 0 : (currentIndex + 1) % order.length;
  gameState.currentTurn = order[next];
}

function handles(gameState, affectedColor) {
  const eliminated = [];
  const remainingPieces = gameState.pieceCounts[affectedColor];
  if (remainingPieces > 0) return eliminated;

  const eliminatedPlayerId = getPlayerIdByColor(gameState, affectedColor);
  if (!eliminatedPlayerId || isPlayerEliminated(gameState, eliminatedPlayerId)) {
    return eliminated;
  }

  const place = 3 - gameState.eliminatedPlayers.length;
  const eliminationRecord = { playerId: eliminatedPlayerId, color: affectedColor, place };
  gameState.eliminatedPlayers.push(eliminationRecord);
  gameState.rankings.push(eliminationRecord);
  eliminated.push(eliminationRecord);

  const activePlayers = getActivePlayerIds(gameState);
  if (activePlayers.length === 1) {
    const winnerId = activePlayers[0];
    const winnerColor = getPlayerColor(gameState, winnerId);

    if (!gameState.rankings.some(entry => entry.playerId === winnerId)) {
      gameState.rankings.unshift({ playerId: winnerId, color: winnerColor, place: 1 });
    }

    gameState.winner = winnerId;
    gameState.status = "finished";
    gameState.captureChain = null;
    gameState.currentTurn = null;
  }

  return eliminated;
}

// ---------------------------------------------------------------------------
// Move validation helpers
// ---------------------------------------------------------------------------

function getNeighbors(pos) {
  const n = MOVEMENT_GRAPH[pos];
  if (!n) return [];
  if (Array.isArray(n)) return n;
  if (n instanceof Set) return Array.from(n);
  return Object.values(n);
}

// A move from→to is forward for a pawn iff it decreases the BFS distance
// to that color's promotion zones. This correctly handles all edges including
// terminal edges like G1<->H2 that JUMP_GRAPH never covers.
function isForwardMove(from, to, color) {
  const dist = FORWARD_DISTANCES[color];
  return (dist[to] ?? Infinity) < (dist[from] ?? Infinity);
}

function getSimpleMoves(gameState, piece) {
  const moves = new Set();
  const neighbors = MOVEMENT_GRAPH[piece.position] || [];

  neighbors.forEach(neighbor => {
    if (getPieceAtPosition(gameState, neighbor)) return;

    if (!piece.king) {
      // PAWNS: Only forward one-step moves.
      if (isForwardMove(piece.position, neighbor, piece.color)) {
        moves.add(neighbor);
      }
    } else {
      // KINGS: Can move one step in any direction.
      moves.add(neighbor);

      // FIX (Bug 1): Kings can slide along straight lines (like a long-range
      // king in international draughts). We extend step-by-step using
      // JUMP_GRAPH to identify collinear cells. The loop continues as long as
      // the next cell in the line is empty; it stops (without adding) when
      // a piece blocks the path.
      let prev = piece.position;
      let curr = neighbor;
      while (true) {
        // Find the cell directly beyond `curr` in the same straight line
        // by looking for a JUMP_GRAPH entry from `prev` that passes over `curr`.
        const straightEntry = (JUMP_GRAPH[prev] || []).find(j => j.over === curr);
        if (!straightEntry) break; // No further cell in this direction.

        const nextCell = straightEntry.to;
        if (getPieceAtPosition(gameState, nextCell)) break; // Blocked — stop here.

        moves.add(nextCell);
        prev = curr;
        curr = nextCell;
      }
    }
  });
  return Array.from(moves);
}

function getCaptureMoves(gameState, piece) {
  const captures = [];
  const jumps = JUMP_GRAPH[piece.position] || [];

  jumps.forEach(jump => {
    const victim = getPieceAtPosition(gameState, jump.over);
    const landing = getPieceAtPosition(gameState, jump.to);

    if (victim && victim.color !== piece.color && !landing) {
      captures.push(jump);

      // FIX (Bug 2): Flying king post-jump extension. After landing at jump.to,
      // we continue along the same straight line. The next step searches
      // JUMP_GRAPH[jump.over] for an entry whose `over` is `jump.to`, giving
      // us the cell directly beyond `jump.to` on the same diagonal. This was
      // previously searching from `currOver` for `j.over === currTo`, which
      // pivots at the wrong cell (the captured piece rather than the landing).
      if (piece.king) {
        let prevOver = jump.over;
        let currTo   = jump.to;
        while (true) {
          // The cell beyond `currTo` in the same line: look in JUMP_GRAPH
          // from `prevOver` for a jump whose `over` is `currTo`.
          // That entry's `to` is the next cell on the ray.
          const extension = (JUMP_GRAPH[prevOver] || []).find(j => j.over === currTo);
          if (!extension) break; // End of the line.

          const nextLanding = extension.to;
          if (getPieceAtPosition(gameState, nextLanding)) break; // Cell occupied.

          captures.push({ over: jump.over, to: nextLanding });
          prevOver = currTo;
          currTo   = nextLanding;
        }
      }
    }
  });
  return captures;
}

function hasAnyCapture(gameState, color) {
  return gameState.pieces
    .filter(p => p.color === color)
    .some(p => getCaptureMoves(gameState, p).length > 0);
}

function getLegalMovesForPiece(gameState, playerId, pieceId) {
  ensureGameStateMeta(gameState);

  if (!gameState || gameState.status !== "active") {
    return [];
  }

  if (gameState.currentTurn !== playerId) {
    return [];
  }

  const piece = getPieceById(gameState, pieceId);
  const playerColor = getPlayerColor(gameState, playerId);

  if (!piece || piece.color !== playerColor) {
    return [];
  }

  if (gameState.captureChain && gameState.captureChain.pieceId !== pieceId) {
    return [];
  }

  const captureMoves = getCaptureMoves(gameState, piece).map(jump => jump.to);
  if (captureMoves.length > 0) {
    return captureMoves;
  }

  if (hasAnyCapture(gameState, playerColor)) {
    return [];
  }

  return getSimpleMoves(gameState, piece);
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
  const playerMeta = {};
  const assignedColors = new Set();

  players.forEach((player, index) => {
    const requestedColor = colorOrder.includes(player.color) ? player.color : colorOrder[index];
    const assignedColor = assignedColors.has(requestedColor)
      ? colorOrder.find(color => !assignedColors.has(color))
      : requestedColor;

    colorAssignments[player.id] = assignedColor;
    assignedColors.add(assignedColor);
    playerMeta[player.id] = {
      name: player.name || `Player ${index + 1}`,
      color: assignedColor,
    };
  });

  const pieces = createInitialPieces();

  return {
    pieces,
    colorAssignments,
    playerMeta,
    pieceCounts: countPiecesByColor(pieces),
    eliminatedPlayers: [],
    rankings: [],
    currentTurn: players[0].id,
    captureChain: null,
    status: "active",
    winner: null,
  };
}

// ---------------------------------------------------------------------------
// Move application
// ---------------------------------------------------------------------------

function getLine(startCell, firstStep) {
  const line = [firstStep];
  let prev = startCell;
  let curr = firstStep;

  while (true) {
    const straightPath = JUMP_GRAPH[prev]?.find(j => j.over === curr);
    if (straightPath) {
      line.push(straightPath.to);
      prev = curr;
      curr = straightPath.to;
    } else {
      break;
    }
  }
  return line;
}

function applyMove(gameState, playerId, pieceId, to) {
  ensureGameStateMeta(gameState);

  // 1. Basic State & Turn Validation
  if (!gameState || gameState.status !== "active") {
    return { ok: false, error: "Game not active" };
  }
  if (gameState.currentTurn !== playerId) {
    return { ok: false, error: "Not your turn" };
  }

  const piece = getPieceById(gameState, pieceId);
  const playerColor = getPlayerColor(gameState, playerId);

  if (!piece || piece.color !== playerColor) {
    return { ok: false, error: "Invalid piece or piece does not belong to you" };
  }

  // 2. Multi-jump Continuity Check
  if (gameState.captureChain && gameState.captureChain.pieceId !== pieceId) {
    return { ok: false, error: "Must continue jump sequence with the same piece" };
  }

  // 3. Target Occupancy Check
  if (getPieceAtPosition(gameState, to)) {
    return { ok: false, error: "Target cell is occupied" };
  }

  const from = piece.position;
  let capturedCell = null;
  let promoted = false;

  if (!piece.king) {
    const isCapture = (JUMP_GRAPH[from] || []).some(j => j.to === to);
    if (!isCapture && !isForwardMove(from, to, playerColor)) {
      return { ok: false, error: "Regular pieces cannot move backwards" };
    }
  }

  // 4. Resolve Captures (High Priority)
  const jumpMoves = getCaptureMoves(gameState, piece);
  const jump = jumpMoves.find(j => j.to === to);

  if (jump) {
    const victim = getPieceAtPosition(gameState, jump.over);
    gameState.pieces = gameState.pieces.filter(p => p.id !== victim.id);
    gameState.pieceCounts = countPiecesByColor(gameState.pieces);
    piece.position = to;
    capturedCell = jump.over;
    const eliminated = handles(gameState, victim.color);

    if (!piece.king && PROMOTION_ZONES[playerColor].includes(to)) {
      piece.king = true;
      promoted = true;
    }

    if (gameState.status === "finished") {
      return {
        ok: true,
        move: { pieceId, from, to, captured: capturedCell, promoted },
        eliminated,
        rankings: gameState.rankings,
        winner: gameState.winner,
      };
    }

    const canJumpAgain = getCaptureMoves(gameState, piece).length > 0;
    
    if (canJumpAgain && !promoted) {
      gameState.captureChain = { pieceId: piece.id };
    } else {
      gameState.captureChain = null;
      advanceTurn(gameState);
    }

    return { 
      ok: true, 
      move: { pieceId, from, to, captured: capturedCell, promoted },
      eliminated,
      rankings: gameState.rankings,
      winner: gameState.winner,
    };
  }

  // 5. Resolve Simple Moves (Only if no jumps are mandatory)
  // FIX (Bug 5): Removed the redundant `gameState.captureChain` check here.
  // By this point, if captureChain were set, the piece-continuity check in
  // step 2 would already have caught any wrong-piece attempt. The captureChain
  // guard here would incorrectly block the continuing piece from making a
  // valid non-capture move after the chain is exhausted (a state that can't
  // occur, but the stale check created confusing logic). Only hasAnyCapture
  // is needed to enforce the mandatory-jump rule.
  if (hasAnyCapture(gameState, playerColor)) {
    return { ok: false, error: "Mandatory capture rule: You must perform a jump." };
  }

  const validSimples = getSimpleMoves(gameState, piece);
  if (validSimples.includes(to)) {
    piece.position = to;

    if (!piece.king && PROMOTION_ZONES[playerColor].includes(to)) {
      piece.king = true;
      promoted = true;
    }

    const eliminated = [];
    for (const color of ['blue', 'green', 'red']) {
      if (gameState.pieceCounts[color] === 0) {
        const playerIdToElim = getPlayerIdByColor(gameState, color);
        if (playerIdToElim && !isPlayerEliminated(gameState, playerIdToElim)) {
          const place = 3 - gameState.eliminatedPlayers.length;
          const eliminationRecord = { playerId: playerIdToElim, color, place };
          gameState.eliminatedPlayers.push(eliminationRecord);
          gameState.rankings.push(eliminationRecord);
          eliminated.push(eliminationRecord);

          // Check for winner
          const activePlayers = getActivePlayerIds(gameState);
          if (activePlayers.length === 1) {
            const winnerId = activePlayers[0];
            const winnerColor = getPlayerColor(gameState, winnerId);
            if (!gameState.rankings.some(entry => entry.playerId === winnerId)) {
              gameState.rankings.unshift({ playerId: winnerId, color: winnerColor, place: 1 });
            }
            gameState.winner = winnerId;
            gameState.status = "finished";
            gameState.captureChain = null;
            gameState.currentTurn = null;
          }
        }
      }
    }

    advanceTurn(gameState);
    return { 
      ok: true, 
      move: { pieceId, from, to, captured: null, promoted },
      eliminated,
      rankings: gameState.rankings,
      winner: gameState.winner,
    };
  }

  // 6. Fallback
  return { ok: false, error: "Invalid move path" };
}

module.exports = {
  STARTING_CELLS,
  PLAYABLE_CELLS,
  MOVEMENT_GRAPH,
  JUMP_GRAPH,
  PROMOTION_ZONES,
  isForwardMove,
  buildForwardDistances,
  createInitialPieces,
  initializeGameState,
  getPieceById,
  getPieceAtPosition,
  getPlayerColor,
  getSimpleMoves,
  getCaptureMoves,
  getLegalMovesForPiece,
  applyMove,
  getNeighbors,
  getLine,
  advanceTurn
};
