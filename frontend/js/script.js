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

// ---------------------------------------------------------------------------
// Board positions (SVG cell centroids — frontend copy for rendering only).
// Keys follow the scheme "{coord}_{color}", e.g. "1A_blue", "E3_green".
// Dark sub-sector: rows 1–4 (1=outer), cols A–D (A=left edge)
// Light sub-sector: rows E–H (E=inner), cols 1–4 (1=left edge)
// ---------------------------------------------------------------------------
const boardPositions = {
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
  const overlay = document.getElementById("countdown-overlay");
  if (overlay) overlay.remove();

  boardState = data.gameState;
  showGame();
});

// Full state push after any server-side mutation (moves, captures, etc.)
socket.on("gameState", (state) => {
  boardState = state;
  const svg = document.querySelector("#boardContainer svg");
  if (svg) renderPieces(svg);
});

socket.on("errorMessage", (message) => {
  alert(`Error: ${message}`);
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
  content.innerHTML = "";
  menu.style.display = "grid";
}

function showLobby() {
  menu.style.display = "none";
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
  content.innerHTML = `
    <h2>Rules</h2>
    <p>3 Player Checkers rules will be defined here.</p>
    <button id="backBtn">Back</button>
  `;
}

function showSettings() {
  menu.style.display = "none";
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

function createPiece(svg, piece) {
  const pos = boardPositions[piece.position];
  if (!pos) return;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "checker-piece");
  group.setAttribute("data-piece-id", piece.id);
  group.setAttribute("data-position", piece.position);
  group.style.cursor = "pointer";

  const outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  outer.setAttribute("cx", pos.x);
  outer.setAttribute("cy", pos.y);
  outer.setAttribute("r", 16);
  outer.setAttribute("fill", piece.color);
  outer.setAttribute("stroke", "#111");
  outer.setAttribute("stroke-width", "2.5");

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

  svg.appendChild(group);
}

function renderPieces(svg) {
  svg.querySelectorAll(".checker-piece").forEach(el => el.remove());
  if (!boardState) return;
  for (const piece of boardState.pieces) {
    createPiece(svg, piece);
  }
}

async function showGame() {
  content.innerHTML = `
    <h2>Game Started</h2>
    <div id="boardContainer"></div>
    <button id="endBtn">End Game (Simulate)</button>
  `;

  const response = await fetch("./assets/board.svg");
  const svgText = await response.text();

  document.getElementById("boardContainer").innerHTML = svgText;

  const svg = document.querySelector("#boardContainer svg");
  renderPieces(svg);
}

function showEndScreen() {
  content.innerHTML = `
    <h2>Game Over</h2>
    <p>Winner: Player X (placeholder)</p>
    <button id="menuBtn">Return to Menu</button>
  `;
}