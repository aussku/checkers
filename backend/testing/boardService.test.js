const {
  getCaptureMoves,
  initializeGameState,
  applyMove,
  getSimpleMoves,
  getNeighbors,
  getLine,
  buildForwardDistances,
  getPieceById,
  isForwardMove,
  MOVEMENT_GRAPH,
  PROMOTION_ZONES,
  JUMP_GRAPH
} = require("../services/boardService");

describe("boardService", () => {
  const players = [
    { id: "player-1", ready: true },
    { id: "player-2", ready: true },
    { id: "player-3", ready: true },
  ];

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("applyMove updates the piece position and advances the turn for a valid move", () => {
    const gameState = initializeGameState(players);

    const result = applyMove(gameState, "player-1", "b2", "BD_4B");

    expect(result).toEqual({
      ok: true,
      move: {
        pieceId: "b2",
        from: "BD_3A",
        to: "BD_4B",
        captured: null,
        promoted: false, 
      },
    });
    expect(gameState.pieces.find(piece => piece.id === "b2").position).toBe("BD_4B");
    expect(gameState.currentTurn).toBe("player-2");
  });

  test("applyMove rejects moving a piece that belongs to another player", () => {
    const gameState = initializeGameState(players);

    const result = applyMove(gameState, "player-1", "g1", "GD_4B");

    expect(result).toMatchObject({
      ok: false,
      error: "Invalid piece or piece does not belong to you",
    });
    expect(gameState.pieces.find(piece => piece.id === "g1").position).toBe("GD_1A");
    expect(gameState.currentTurn).toBe("player-1");
  });

  test("getCaptureMoves returns a jump when an enemy piece can be captured", () => {
    const gameState = {
      pieces: [
        { id: "b1", color: "blue", position: "BD_1A", king: false },
        { id: "g1", color: "green", position: "BD_2B", king: false },
      ],
      colorAssignments: {
        "player-1": "blue",
        "player-2": "green",
        "player-3": "red",
      },
      currentTurn: "player-1",
      captureChain: null,
      status: "active",
      winner: null,
    };

    const captures = getCaptureMoves(gameState, gameState.pieces[0]);

    expect(captures).toEqual([
      { over: "BD_2B", to: "BD_3C" },
    ]);
  });

  test("applyMove performs a capture and removes the jumped piece", () => {
    const gameState = {
      pieces: [
        { id: "b1", color: "blue", position: "BD_1A", king: false },
        { id: "g1", color: "green", position: "BD_2B", king: false },
      ],
      colorAssignments: {
        "player-1": "blue",
        "player-2": "green",
        "player-3": "red",
      },
      currentTurn: "player-1",
      captureChain: null,
      status: "active",
      winner: null,
    };

    const result = applyMove(gameState, "player-1", "b1", "BD_3C");

    expect(result).toEqual({
      ok: true,
      move: {
        pieceId: "b1",
        from: "BD_1A",
        to: "BD_3C",
        captured: "BD_2B",
        promoted: false,
      },
    });
    expect(gameState.pieces.find(piece => piece.id === "b1").position).toBe("BD_3C");
    expect(gameState.pieces.find(piece => piece.id === "g1")).toBeUndefined();
    expect(gameState.captureChain).toBeNull();
    expect(gameState.currentTurn).toBe("player-2");
  });

  test("applyMove rejects a simple move when another piece has a capture available", () => {
    const gameState = {
      pieces: [
        { id: "b1", color: "blue", position: "BD_1A", king: false },
        { id: "b2", color: "blue", position: "BD_3A", king: false },
        { id: "g1", color: "green", position: "BD_2B", king: false },
      ],
      colorAssignments: {
        "player-1": "blue",
        "player-2": "green",
        "player-3": "red",
      },
      currentTurn: "player-1",
      captureChain: null,
      status: "active",
      winner: null,
    };

    const result = applyMove(gameState, "player-1", "b2", "BD_4B");

    expect(result).toMatchObject({
      ok: false,
      error: "Mandatory capture rule: You must perform a jump.",
    });
    expect(gameState.pieces.find(piece => piece.id === "b2").position).toBe("BD_3A");
    expect(gameState.currentTurn).toBe("player-1");
  });

  test("applyMove keeps captureChain active when the same piece can capture again", () => {
    const gameState = {
      pieces: [
        { id: "b1", color: "blue", position: "BD_1A", king: false },
        { id: "g1", color: "green", position: "BD_2B", king: false },
        { id: "g2", color: "green", position: "BD_4D", king: false },
      ],
      colorAssignments: {
        "player-1": "blue",
        "player-2": "green",
        "player-3": "red",
      },
      currentTurn: "player-1",
      captureChain: null,
      status: "active",
      winner: null,
    };

    const result = applyMove(gameState, "player-1", "b1", "BD_3C");

    expect(result).toMatchObject({
      ok: true,
      move: {
        pieceId: "b1",
        from: "BD_1A",
        to: "BD_3C",
        captured: "BD_2B",
      },
    });
    expect(gameState.captureChain).toEqual({ pieceId: "b1" });
    expect(gameState.currentTurn).toBe("player-1");
  });

  test("applyMove rejects moving a different piece during a capture chain", () => {
    const gameState = {
      pieces: [
        { id: "b1", color: "blue", position: "BD_3C", king: false },
        { id: "b2", color: "blue", position: "BL_E1", king: false },
        { id: "g2", color: "green", position: "BD_4D", king: false },
      ],
      colorAssignments: {
        "player-1": "blue",
        "player-2": "green",
        "player-3": "red",
      },
      currentTurn: "player-1",
      captureChain: { pieceId: "b1" },
      status: "active",
      winner: null,
    };

    const result = applyMove(gameState, "player-1", "b2", "BL_F2");

    expect(result).toMatchObject({
      ok: false,
      error: "Must continue jump sequence with the same piece",
    });
  });

  test("applyMove promotes a pawn to a king when reaching the promotion zone", () => {
    const gameState = {
      pieces: [{ id: "b1", color: "blue", position: "GD_2B", king: false }],
      colorAssignments: { "player-1": "blue", "player-2": "green", "player-3": "red" },
      currentTurn: "player-1",
      captureChain: null,
      status: "active",
    };

    const result = applyMove(gameState, "player-1", "b1", "GD_1A");

    expect(result.ok).toBe(true);
    expect(result.move.promoted).toBe(true);
    expect(gameState.pieces[0].king).toBe(true);
  });

  test("getSimpleMoves allows a King to slide multiple empty squares", () => {
    const piece = { id: "bk", color: "blue", position: "BD_1A", king: true };
    const gameState = {
      pieces: [piece],
      colorAssignments: { "player-1": "blue" },
    };

    const moves = getSimpleMoves(gameState, piece);
    
    expect(moves).toContain("BD_3C");
  });

  test("applyMove rejects moving to an already occupied cell", () => {
    const gameState = initializeGameState(players);
    const result = applyMove(gameState, "player-1", "b1", "BD_3A");

    expect(result).toMatchObject({
      ok: false,
      error: "Target cell is occupied",
    });
  });

  test("applyMove rejects a move that doesn't follow the movement graph", () => {
    const gameState = initializeGameState(players);

    const result = applyMove(gameState, "player-1", "b2", "RD_4B");

    expect(result).toMatchObject({
      ok: false,
      error: "Invalid move path",
    });
  });

  test("applyMove rejects moves when game status is not active", () => {
    const gameState = initializeGameState(players);
    gameState.status = "finished";
    const result = applyMove(gameState, "player-1", "b2", "BD_4B");

    expect(result.error).toBe("Game not active");
  });

  test("applyMove rejects moves if it is not the player's turn", () => {
    const gameState = initializeGameState(players);
    const result = applyMove(gameState, "player-2", "g1", "GD_2B");

    expect(result.error).toBe("Not your turn");
  });

  test("getCaptureMoves handles flying king captures (long-range jump)", () => {
    const gameState = {
      pieces: [
        { id: "bk", color: "blue", position: "BD_1A", king: true },
        { id: "g1", color: "green", position: "BD_2B", king: false },
      ],
      colorAssignments: { "player-1": "blue", "player-2": "green" },
      currentTurn: "player-1",
    };

    const captures = getCaptureMoves(gameState, gameState.pieces[0]);
    
    const targets = captures.map(c => c.to);
    expect(targets).toContain("BD_3C");
    expect(targets).toContain("BD_4D");
  });

  test("getCaptureMoves handles multiple landing squares for a flying king", () => {
    const gameState = {
      pieces: [
        { id: "bk", color: "blue", position: "BD_1A", king: true },
        { id: "g1", color: "green", position: "BD_2B", king: false },
      ],
      colorAssignments: { "player-1": "blue", "player-2": "green" },
    };

    const captures = getCaptureMoves(gameState, gameState.pieces[0]);
    
    const targets = captures.map(c => c.to);
    expect(targets).toContain("BD_3C");
    expect(targets).toContain("BD_4D");
  });

  test("applyMove ends turn if a piece promotes during a capture chain", () => {
    const gameState = {
      pieces: [
        { id: "b1", color: "blue", position: "GD_3C", king: false },
        { id: "g1", color: "green", position: "GD_2B", king: false },
        { id: "g2", color: "green", position: "BD_2B", king: false },
      ],
      colorAssignments: { "player-1": "blue", "player-2": "green", "player-3": "red" },
      currentTurn: "player-1",
      status: "active",
    };

    const result = applyMove(gameState, "player-1", "b1", "GD_1A");

    expect(result.move.promoted).toBe(true);
    expect(gameState.captureChain).toBeNull();
    expect(gameState.currentTurn).toBe("player-2");
  });

  test("getNeighbors returns empty array for invalid positions", () => {
    const { getNeighbors } = require("../services/boardService"); 
    expect(getNeighbors("INVALID_CELL")).toEqual([]);
  });

  test("applyMove returns error if player is not assigned a color", () => {
    const gameState = initializeGameState(players);

    gameState.currentTurn = "player-4"; 
    
    const result = applyMove(gameState, "player-4", "b1", "BD_2B");
    expect(result.error).toBe("Invalid piece or piece does not belong to you");
  });

  test("getLine: successfully follows a multi-step straight path", () => {
    const line = getLine("BD_1A", "BD_2B");

    expect(line.length).toBeGreaterThan(1);
    expect(line).toContain("BD_3C");
  });

  test("getNeighbors handles different data structures", () => {
    MOVEMENT_GRAPH["TEST_ARRAY"] = ["A1", "B2"];
    expect(getNeighbors("TEST_ARRAY")).toEqual(["A1", "B2"]);

    MOVEMENT_GRAPH["TEST_SET"] = new Set(["C3", "D4"]);
    expect(getNeighbors("TEST_SET")).toEqual(["C3", "D4"]);

    MOVEMENT_GRAPH["TEST_OBJ"] = { dir1: "E5", dir2: "F6" };
    expect(getNeighbors("TEST_OBJ")).toEqual(["E5", "F6"]);
    
    delete MOVEMENT_GRAPH["TEST_ARRAY"];
    delete MOVEMENT_GRAPH["TEST_SET"];
    delete MOVEMENT_GRAPH["TEST_OBJ"];
  });

  test("Branch: buildForwardDistances handles cells missing from MOVEMENT_GRAPH", () => {
    PROMOTION_ZONES["ghost_color"] = ["NON_EXISTENT_CELL"];
    
    const distances = buildForwardDistances("ghost_color");
    
    expect(distances["NON_EXISTENT_CELL"]).toBe(0);
    expect(Object.keys(distances).length).toBe(1);

    delete PROMOTION_ZONES["ghost_color"];
  });

  test("Branch: getPieceById returns null for non-existent piece ID", () => {
    const gameState = { pieces: [{ id: "real-piece" }] };

    const found = getPieceById(gameState, "real-piece");
    expect(found.id).toBe("real-piece");

    const missing = getPieceById(gameState, "fake-id");
    expect(missing).toBeNull();
  });

  test("Branch: isForwardMove handles off-board or invalid cells", () => {
    const toInvalid = isForwardMove("BD_1A", "INVALID_CELL", "blue");
    expect(toInvalid).toBe(false);

    const fromInvalid = isForwardMove("INVALID_CELL", "BD_1A", "blue");
    expect(fromInvalid).toBe(true);

    expect(isForwardMove("INVALID_1", "INVALID_2", "blue")).toBe(false);
  });

  test("Branch: getSimpleMoves handles pieces at invalid/off-graph positions", () => {
    const gameState = {
      pieces: [
        { id: "ghost", color: "blue", position: "OFF_GRID_99", king: false }
      ],
      colorAssignments: { "player-1": "blue" }
    };

    const moves = getSimpleMoves(gameState, gameState.pieces[0]);
    
    expect(moves).toEqual([]);
  });

  test("Branch: getSimpleMoves when piece has neighbors but no jump data", () => {
    const realPos = "BD_1A"; 
    
    const originalJumpEntry = JUMP_GRAPH[realPos];
    delete JUMP_GRAPH[realPos];

    const gameState = {
      pieces: [{ id: "p1", color: "blue", position: realPos, king: true }],
      colorAssignments: { "player-1": "blue" }
    };

    getSimpleMoves(gameState, gameState.pieces[0]);

    JUMP_GRAPH[realPos] = originalJumpEntry;
  });

  test("Branch: applyMove handles non-existent piece ID", () => {
    const gameState = initializeGameState(players);
    const result = applyMove(gameState, "player-1", "ghost-id-999", "BD_2B");

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("Branch: getCaptureMoves handles a piece on a square with no jump definitions", () => {
    const gameState = {
      pieces: [{ id: "edge-pawn", color: "blue", position: "TOTALLY_FAKE_SQUARE", king: false }],
      colorAssignments: { "player-1": "blue" },
      currentTurn: "player-1"
    };

    const captures = getCaptureMoves(gameState, gameState.pieces[0]);

    expect(captures).toEqual([]); 
  });

  test("Branch: getSimpleMoves hits Long-range King block", () => {
    const gameState = {
      pieces: [
        { id: "king", color: "blue", position: "BD_1A", king: true },
        { id: "blocker", color: "red", position: "BD_3C", king: false } 
      ],
      colorAssignments: { "player-1": "blue", "player-2": "red" }
    };

    const moves = getSimpleMoves(gameState, gameState.pieces[0]);

    expect(moves).toContain("BD_2B");
    expect(moves).not.toContain("BD_3C");
  });

  test("Branch: getCaptureMoves hits fallback for missing JUMP_GRAPH entry", () => {
    const gameState = {
      pieces: [
        { id: "king", color: "blue", position: "START", king: true },
        { id: "victim", color: "red", position: "FAKE_SQUARE", king: false }
      ],
      colorAssignments: { "player-1": "blue", "player-2": "red" }
    };

    JUMP_GRAPH["START"] = [{ over: "FAKE_SQUARE", to: "LANDING" }];

    getCaptureMoves(gameState, gameState.pieces[0]);
    
    delete JUMP_GRAPH["START"];
  });

  test("Branch: getCaptureMoves hits Post-capture slide blocked", () => {

    const gameState = {
      pieces: [
        { id: "king", color: "blue", position: "BD_1A", king: true },
        { id: "victim", color: "red", position: "BD_2B", king: false },
        { id: "blocker", color: "blue", position: "BD_4D", king: false }
      ],
      colorAssignments: { "player-1": "blue", "player-2": "red" }
    };

    const captures = getCaptureMoves(gameState, gameState.pieces[0]);

    const has3C = captures.some(c => c.to === "BD_3C");
    const has4D = captures.some(c => c.to === "BD_4D");

    expect(has3C).toBe(true);
    expect(has4D).toBe(false);
  });
});

describe("Board Integration (Bot Gameplay)", () => {
  test("Full sequence: Move, Mandatory Capture, and Promotion", () => {
    const players = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
    const state = initializeGameState(players);

    state.pieces = [
      { id: "b3", color: "blue", position: "BD_2B", king: false },
      { id: "g1", color: "green", position: "GD_2B", king: false } 
    ];

    const move1 = applyMove(state, "p1", "b3", "BD_3A"); 
    
    if (!move1.ok) console.log("Error:", move1.error);
    expect(move1.ok).toBe(true);
    expect(state.currentTurn).toBe("p2"); 

    const bluePiece = state.pieces.find(p => p.id === "b3");
    bluePiece.position = "GD_3C";
    state.currentTurn = "p2"; 

    const captureMove = applyMove(state, "p2", "g1", "GD_4D");
    
    expect(captureMove.ok).toBe(true);
    expect(captureMove.move.captured).toBe("GD_3C");
    expect(state.pieces.find(p => p.id === "b3")).toBeUndefined();
  });
});