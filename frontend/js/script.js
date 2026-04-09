const content = document.getElementById("content");
const menu = document.getElementById("menu");
const socket = io();

let gameState = {
  isHost: false,
  players: [],
  roomCode: null,
};

// Board state is owned by the server. This is a local rendering copy only.
let boardState = null;
let selectedPieceId = null;
let invalidPieceId = null;
let invalidMoveTimer = null;

const boardPositions = {
  // RED outer sector
  "RD_4D": { x: 460.8, y: 568.0 }, "RD_4C": { x: 389.3, y: 604.5 },
  "RD_3D": { x: 465.3, y: 650.0 }, "RD_4B": { x: 322.8, y: 638.0 },
  "RD_3C": { x: 400.8, y: 675.3 }, "RD_2D": { x: 469.0, y: 725.5 },
  "RD_4A": { x: 257.3, y: 671.0 }, "RD_3B": { x: 341.8, y: 696.8 },
  "RD_2C": { x: 410.3, y: 739.8 }, "RD_1D": { x: 471.8, y: 796.8 },
  "RD_3A": { x: 282.5, y: 720.0 }, "RD_2B": { x: 356.8, y: 752.3 },
  "RD_1C": { x: 417.8, y: 800.5 }, "RD_2A": { x: 303.8, y: 766.0 },
  "RD_1B": { x: 368.3, y: 804.3 }, "RD_1A": { x: 321.3, y: 808.5 },

  // BLUE inner sector
  "BL_E4": { x: 421.5, y: 500.0 }, "BL_E3": { x: 354.1, y: 456.3 },
  "BL_F4": { x: 352.7, y: 544.9 }, "BL_E2": { x: 291.9, y: 415.5 },
  "BL_F3": { x: 298.6, y: 501.7 }, "BL_G4": { x: 289.2, y: 585.9 },
  "BL_E1": { x: 230.5, y: 375.3 }, "BL_F2": { x: 250.5, y: 461.3 },
  "BL_G3": { x: 247.5, y: 542.1 }, "BL_H4": { x: 228.9, y: 623.9 },
  "BL_F1": { x: 200.7, y: 421.6 }, "BL_G2": { x: 209.9, y: 502.1 },
  "BL_H3": { x: 198.6, y: 579.0 }, "BL_G1": { x: 171.5, y: 463.0 },
  "BL_H2": { x: 170.6, y: 538.0 }, "BL_H1": { x: 143.5, y: 499.4 },

   // BLUE outer sector
  "BD_4D": { x: 460.7, y: 432.0 }, "BD_4C": { x: 464.9, y: 351.8 },
  "BD_3D": { x: 387.5, y: 394.9 }, "BD_4B": { x: 469.1, y: 277.5 },
  "BD_3C": { x: 397.9, y: 326.4 }, "BD_2D": { x: 320.2, y: 360.4 },
  "BD_4A": { x: 473.3, y: 204.3 }, "BD_3B": { x: 408.7, y: 264.6 },
  "BD_2C": { x: 337.2, y: 302.4 }, "BD_1D": { x: 257.1, y: 327.2 },
  "BD_3A": { x: 418.2, y: 201.6 }, "BD_2B": { x: 353.2, y: 249.8 },
  "BD_1C": { x: 280.9, y: 278.5 }, "BD_2A": { x: 367.8, y: 197.0 },
  "BD_1B": { x: 302.4, y: 233.8 }, "BD_1A": { x: 322.2, y: 190.9 },

  // GREEN inner sector
  "GL_E4": { x: 539.3, y: 432.0 }, "GL_E3": { x: 610.8, y: 395.5 },
  "GL_F4": { x: 534.8, y: 350.0 }, "GL_E2": { x: 677.3, y: 362.0 },
  "GL_F3": { x: 599.3, y: 324.8 }, "GL_G4": { x: 531.0, y: 274.5 },
  "GL_E1": { x: 742.8, y: 329.0 }, "GL_F2": { x: 658.3, y: 303.3 },
  "GL_G3": { x: 589.8, y: 260.3 }, "GL_H4": { x: 528.3, y: 203.3 },
  "GL_F1": { x: 717.5, y: 280.0 }, "GL_G2": { x: 643.3, y: 247.8 },
  "GL_H3": { x: 582.3, y: 199.5 }, "GL_G1": { x: 696.3, y: 234.0 },
  "GL_H2": { x: 631.8, y: 195.8 }, "GL_H1": { x: 678.8, y: 191.5 },

  // GREEN outer sector
  "GD_4D": { x: 578.5, y: 500.0 }, "GD_4C": { x: 645.9, y: 543.7 },
  "GD_3D": { x: 647.3, y: 455.1 }, "GD_4B": { x: 708.1, y: 584.5 },
  "GD_3C": { x: 701.4, y: 498.3 }, "GD_2D": { x: 710.8, y: 414.1 },
  "GD_4A": { x: 769.5, y: 624.7 }, "GD_3B": { x: 749.5, y: 538.7 },
  "GD_2C": { x: 752.5, y: 457.9 }, "GD_1D": { x: 771.1, y: 376.1 },
  "GD_3A": { x: 799.3, y: 578.4 }, "GD_2B": { x: 790.1, y: 497.9 },
  "GD_1C": { x: 801.4, y: 421.0 }, "GD_2A": { x: 828.5, y: 537.0 },
  "GD_1B": { x: 829.4, y: 462.0 }, "GD_1A": { x: 856.5, y: 500.6 },

  // RED inner sector
  "RL_E4": { x: 539.3, y: 568.0 }, "RL_E3": { x: 535.1, y: 648.2 },
  "RL_F4": { x: 612.5, y: 605.1 }, "RL_E2": { x: 530.9, y: 722.5 },
  "RL_F3": { x: 602.1, y: 673.6 }, "RL_G4": { x: 679.8, y: 639.6 },
  "RL_E1": { x: 526.7, y: 795.7 }, "RL_F2": { x: 591.3, y: 735.4 },
  "RL_G3": { x: 662.8, y: 697.6 }, "RL_H4": { x: 742.9, y: 672.8 },
  "RL_F1": { x: 581.8, y: 798.4 }, "RL_G2": { x: 646.8, y: 750.2 },
  "RL_H3": { x: 719.1, y: 721.5 }, "RL_G1": { x: 632.2, y: 803.0 },
  "RL_H2": { x: 697.6, y: 766.2 }, "RL_H1": { x: 677.8, y: 809.1 },
};

// ---------------------------------------------------------------------------
// Socket — lobby events
// ---------------------------------------------------------------------------

socket.on("roomCreated", (data) => {
  gameState.roomCode = data.code;
  gameState.players = data.players;
  gameState.isHost = true;
  renderLobby();
});

socket.on("roomUpdate", (data) => {
  if (gameState.roomCode) {
    gameState.players = data.players;
    if (data.hostId === socket.id) gameState.isHost = true;
    renderLobby();
  }
});

socket.on("joinSuccess", (data) => {
  gameState.isHost = false;
  gameState.roomCode = data.code;
  gameState.players = data.players;
  renderLobby();
});

socket.on("startCountdown", (seconds) => {
  let timeLeft = seconds;
  const timerDisplay = document.createElement("div");
  timerDisplay.id = "countdown-overlay";
  timerDisplay.innerHTML = `<div class="timer-card">Game Starting in ${timeLeft}...</div>`;
  document.body.appendChild(timerDisplay);

  const interval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      timerDisplay.querySelector(".timer-card").innerText = `Game Starting in ${timeLeft}...`;
    } else {
      clearInterval(interval);
      timerDisplay.remove();
    }
  }, 1000);
});

socket.on("cancelCountdown", () => {
  const overlay = document.getElementById("countdown-overlay");
  if (overlay) overlay.remove();
});

// ---------------------------------------------------------------------------
// Socket — game events
// ---------------------------------------------------------------------------

socket.on("gameStarted", (data) => {
  console.log("Game started with data:", data);
  const overlay = document.getElementById("countdown-overlay");
  if (overlay) overlay.remove();

  boardState = data.gameState;
  showGame();
});

// Full state push after any server-side mutation (moves, captures, etc.)
socket.on("gameState", (state) => {
  console.log("Game state received:", state);
  boardState = state;
  invalidPieceId = null;

  if (selectedPieceId) {
    const stillExists = boardState.pieces.some(p => p.id === selectedPieceId);
    if (!stillExists) selectedPieceId = null;
  }

  const svg = document.querySelector("#boardContainer svg");
  if (svg) {
    renderCellTargets(svg);
    renderPieces(svg);
  }

  renderScoreboard();
  updateTurnDisplay();

  if (boardState.status === "finished") {
    showEndScreen();
  }
});

socket.on("errorMessage", (message) => {
  showMoveFeedback(message, "error");
});

socket.on("invalidMove", ({ pieceId, error }) => {
  invalidPieceId = pieceId;

  const svg = document.querySelector("#boardContainer svg");
  if (svg) {
    renderPieces(svg);
  }

  showMoveFeedback(error || "Invalid move", "error");

  clearTimeout(invalidMoveTimer);
  invalidMoveTimer = setTimeout(() => {
    invalidPieceId = null;
    const currentSvg = document.querySelector("#boardContainer svg");
    if (currentSvg) {
      renderPieces(currentSvg);
    }
  }, 450);
});

// ---------------------------------------------------------------------------
// UI event routing
// ---------------------------------------------------------------------------

menu.addEventListener("click", (e) => {
  const id = e.target.id;
  if (id === "playBtn") showLobby();
  if (id === "rulesBtn") showRules();
  if (id === "settingsBtn") showSettings();
});

content.addEventListener("click", (e) => {
  const id = e.target.id;

  if (id === "hostBtn") hostGame();
  if (id === "joinBtn") joinGame();

  if (id === "confirmJoinBtn") {
    const codeInput = document.getElementById("roomInput");
    const code = codeInput.value.trim().toUpperCase();
    if (code.length === 4) {
      socket.emit("joinRoom", code);
    } else {
      alert("Please enter a 4-character code.");
    }
  }

  if (id === "backBtn") {
    if (gameState.roomCode) socket.emit("leaveRoom");
    gameState.roomCode = null;
    gameState.players = [];
    gameState.isHost = false;
    showMenu();
  }

  if (id === "readyBtn") socket.emit("toggleReady");

  if (id === "endBtn") showEndScreen();

  if (id === "menuBtn") {
    socket.emit("leaveRoom");
    gameState.roomCode = null;
    gameState.players = [];
    boardState = null;
    showMenu();
  }
});

// ---------------------------------------------------------------------------
// Screen renderers
// ---------------------------------------------------------------------------

function showMenu() {
  content.style.display = "none"
  content.innerHTML = "";
  menu.style.display = "grid";
}

function showLobby() {
  menu.style.display = "none";
  content.style.display = "block";
  content.innerHTML = `
    <h2>Game Lobby</h2>
    <p>Choose an option:</p>
    <button id="hostBtn">Host Game</button>
    <button id="joinBtn">Join Game</button>
    <button id="backBtn">Back</button>
  `;
}

function showRules() {
  menu.style.display = "none";
  content.style.display = "block";
  content.innerHTML = `
    <h2>Rules</h2>
    <p>3 Player Checkers rules will be defined here.</p>
    <button id="backBtn">Back</button>
  `;
}

function showSettings() {
  menu.style.display = "none";
  content.style.display = "block";
  content.innerHTML = `
    <h2>Settings</h2>
    <p>Settings placeholder (board size, timer, etc.)</p>
    <button id="backBtn">Back</button>
  `;
}

function hostGame() {
  socket.emit("createRoom");
}

function renderLobby() {
  const playerCount = gameState.players.length;
  const playersNeeded = 3 - playerCount;
  const me = gameState.players.find(p => p.id === socket.id);

  const statusMessage = playerCount < 3
    ? `Waiting for ${playersNeeded} more player${playersNeeded > 1 ? "s" : ""}...`
    : "Ready to begin!";

  content.style.display = "block";
  content.innerHTML = `
    <h2>Game Lobby</h2>
    <div class="lobby-info">
      <p>Room Code: <strong style="color: #2ecc71;">${gameState.roomCode}</strong></p>
      <p>${statusMessage}</p>
      <p>Connected: ${playerCount}/3</p>
    </div>
    <ul class="player-list">
      ${gameState.players.map((p, i) => `
        <li>${p.ready ? "✅" : "⏳"} Player ${i + 1} ${p.id === socket.id ? "<strong>(You)</strong>" : ""}</li>
      `).join("")}
    </ul>
    <button id="readyBtn" class="${me.ready ? "active" : ""}">
      ${me.ready ? "Unready" : "Ready Up"}
    </button>
    <button id="backBtn">Leave Lobby</button>
  `;
}

function joinGame() {
  menu.style.display = "none";
  content.style.display = "block";
  content.innerHTML = `
    <h2>Join Game</h2>
    <p>Enter the 4-character room code:</p>
    <input type="text" id="roomInput" maxlength="4" placeholder="CODE"
      style="text-transform: uppercase; font-size: 1.5rem; text-align: center; width: 150px; display: block; margin: 10px auto;">
    <button id="confirmJoinBtn">Join Room</button>
    <button id="backBtn">Back</button>
  `;
}

// ---------------------------------------------------------------------------
// Board rendering  (pure display — no game logic lives here)
// ---------------------------------------------------------------------------

function getMyPlayerId() {
  return socket.id;
}

function getMyColor() {
  if (!boardState || !boardState.colorAssignments) return null;
  return boardState.colorAssignments[getMyPlayerId()] || null;
}

function isMyTurn() {
  return !!boardState && boardState.currentTurn === getMyPlayerId();
}

function getPieceById(pieceId) {
  if (!boardState) return null;
  return boardState.pieces.find(p => p.id === pieceId) || null;
}

function getPieceAtPosition(position) {
  if (!boardState) return null;
  return boardState.pieces.find(p => p.position === position) || null;
}

function createPiece(svg, piece) {
  const pos = boardPositions[piece.position];
  if (!pos) return;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const isSelected = selectedPieceId === piece.id;
  const isInvalid = invalidPieceId === piece.id;

  group.setAttribute(
    "class",
    `checker-piece${isInvalid ? " invalid-move-piece" : ""}`
  );
  group.setAttribute("data-piece-id", piece.id);
  group.setAttribute("data-position", piece.position);
  group.style.cursor = "pointer";

  const outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  outer.setAttribute("cx", pos.x);
  outer.setAttribute("cy", pos.y);
  outer.setAttribute("r", 16);
  outer.setAttribute("fill", piece.color);
  outer.setAttribute("stroke", isInvalid ? "#ff4d4f" : (isSelected ? "#ffd700" : "#111"));
  outer.setAttribute("stroke-width", isInvalid ? "4.5" : (isSelected ? "4" : "2.5"));

  const inner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  inner.setAttribute("cx", pos.x);
  inner.setAttribute("cy", pos.y);
  inner.setAttribute("r", 10);
  inner.setAttribute("fill", "rgba(255,255,255,0.18)");
  inner.setAttribute("stroke", "rgba(0,0,0,0.25)");
  inner.setAttribute("stroke-width", "1");

  group.appendChild(outer);
  group.appendChild(inner);

  if (piece.king) {
    const kingMark = document.createElementNS("http://www.w3.org/2000/svg", "text");
    kingMark.setAttribute("x", pos.x);
    kingMark.setAttribute("y", pos.y + 5);
    kingMark.setAttribute("text-anchor", "middle");
    kingMark.setAttribute("font-size", "12");
    kingMark.setAttribute("font-weight", "bold");
    kingMark.setAttribute("fill", "white");
    kingMark.textContent = "K";
    group.appendChild(kingMark);
  }

  group.addEventListener("click", (e) => {
    e.stopPropagation();
    handlePieceClick(piece.id, svg);
  });

  svg.appendChild(group);
}

function renderPieces(svg) {
  svg.querySelectorAll(".checker-piece").forEach(el => el.remove());
  if (!boardState) return;

  for (const piece of boardState.pieces) {
    createPiece(svg, piece);
  }
}

function handlePieceClick(pieceId, svg) {
  if (!boardState) return;
  if (!isMyTurn()) return;

  const piece = getPieceById(pieceId);
  if (!piece) return;

  const myColor = getMyColor();
  if (!myColor) return;

  // Only allow selecting your own pieces
  if (piece.color !== myColor) return;

  if (selectedPieceId === pieceId) {
    selectedPieceId = null;
  } else {
    selectedPieceId = pieceId;
  }

  renderPieces(svg);
}

function renderCellTargets(svg) {
  svg.querySelectorAll(".board-cell-target").forEach(el => el.remove());

  Object.entries(boardPositions).forEach(([position, pos]) => {
    const target = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    target.setAttribute("class", "board-cell-target");
    target.setAttribute("cx", pos.x);
    target.setAttribute("cy", pos.y);
    target.setAttribute("r", 18);
    target.setAttribute("fill", "transparent");
    target.setAttribute("data-position", position);
    target.style.cursor = "pointer";

    target.addEventListener("click", () => {
      handleCellClick(position);
    });

    svg.appendChild(target);
  });
}

function handleCellClick(targetPosition) {
  if (!boardState) return;
  if (!isMyTurn()) {
    console.log("Not your turn");
    return;
  }
  if (!selectedPieceId) {
    console.log("No piece selected");
    return;
  }

  console.log("Emitting move:", {
    roomCode: gameState.roomCode,
    pieceId: selectedPieceId,
    to: targetPosition,
  });

  socket.emit("makeMove", {
    roomCode: gameState.roomCode,
    pieceId: selectedPieceId,
    to: targetPosition,
  });
}

function showMoveFeedback(message, type = "info") {
  const box = document.getElementById("moveFeedback");
  if (!box) return;

  box.textContent = message;
  box.className = type === "error" ? "move-feedback error show" : "move-feedback show";

  setTimeout(() => {
    box.classList.remove("show");
  }, 1600);
}

function getPlayerLabelByColor(color) {
  if (color === "blue") return "Blue";
  if (color === "green") return "Green";
  if (color === "red") return "Red";
  return color;
}

function renderScoreboard() {
  const scoreboard = document.getElementById("scoreboard");
  if (!scoreboard || !boardState || !boardState.pieceCounts) return;

  const eliminated = new Map((boardState.eliminatedPlayers || []).map(entry => [entry.color, entry.place]));
  const colors = ["blue", "green", "red"];

  scoreboard.innerHTML = colors.map(color => {
    const place = eliminated.get(color);
    const suffix = place ? `${place}${place === 1 ? "st" : place === 2 ? "nd" : "rd"}` : "Active";
    return `
      <div class="score-chip ${color}${place ? " eliminated" : ""}">
        <span class="score-dot"></span>
        <span class="score-name">${getPlayerLabelByColor(color)}</span>
        <span class="score-count">${boardState.pieceCounts[color] ?? 0}</span>
        <span class="score-status">${place ? `Eliminated | ${suffix}` : suffix}</span>
      </div>
    `;
  }).join("");
}

// Updates the turn display based on the current board state.
function updateTurnDisplay() {
  if (!boardState || !boardState.currentTurn || !boardState.colorAssignments) {
    return; 
  }
  
  const turnText = document.getElementById("turnText");
  const turnIndicator = document.getElementById("turnIndicator");
  if (!turnText || !turnIndicator) return;
  
  const currentPlayerId = boardState.currentTurn;
  const currentColor = boardState.colorAssignments[currentPlayerId];
  
  if (currentPlayerId === socket.id) {
    turnText.textContent = "Your Turn!";
  } else {
    let playerNumber;
    if (currentColor === "blue") playerNumber = 1;
    else if (currentColor === "green") playerNumber = 2;
    else if (currentColor === "red") playerNumber = 3;
    turnText.textContent = `Player ${playerNumber}'s Turn`;
  }

  turnText.style.color = currentColor;
  turnIndicator.style.borderColor = currentColor;
  turnIndicator.style.boxShadow = `0 0 20px ${currentColor}, 0 4px 12px var(--shadow)`;
}

async function showGame() {
  content.style.display = "block";
  content.innerHTML = `
    <h2>Game Started</h2>
    <div id="turnIndicator">
      <span id="turnText">Waiting for turn info...</span>
    </div>
    <div id="scoreboard"></div>
    <div id="moveFeedback" class="move-feedback"></div>
    <div id="boardContainer"></div>
    <button id="endBtn">End Game (Simulate)</button>
  `;

  const response = await fetch("./assets/board.svg");
  const svgText = await response.text();

  document.getElementById("boardContainer").innerHTML = svgText;

  const svg = document.querySelector("#boardContainer svg");
  renderCellTargets(svg);
  renderPieces(svg);
  renderScoreboard();
  updateTurnDisplay();
}

function showEndScreen() {
  content.style.display = "block";
  const rankings = (boardState?.rankings || []).slice().sort((a, b) => a.place - b.place);
  const winner = rankings.find(entry => entry.place === 1);
  content.innerHTML = `
    <h2>Game Over</h2>
    <p>Winner: ${winner ? getPlayerLabelByColor(winner.color) : "Unknown"}</p>
    <div class="final-rankings">
      ${rankings.map(entry => `<p>${entry.place}. ${getPlayerLabelByColor(entry.color)}</p>`).join("")}
    </div>
    <button id="menuBtn">Return to Menu</button>
  `;
}

