const {
  getCaptureMoves,
  initializeGameState,
  applyMove,
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
      error: "You can only move your own pieces",
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
      error: "You must capture — a jump is available",
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
      error: "You must continue capturing with the same piece",
    });
  });
});
