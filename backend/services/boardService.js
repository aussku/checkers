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

module.exports = {
  STARTING_CELLS,
  createInitialPieces,
  initializeGameState,
};