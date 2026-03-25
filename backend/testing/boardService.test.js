const {
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
});
