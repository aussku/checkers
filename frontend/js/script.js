const content = document.getElementById("content");
const menu = document.getElementById("menu");
const socket = io();

let gameState = {
  isHost: false,
  players: [],
  roomCode: null
};

const boardPositions = {
  // BLUE (left side)
  blue_1:  { x: 324.3, y: 194.2 },
  blue_2:  { x: 415.5, y: 200.4 },
  blue_3:  { x: 351.5, y: 247.9 },
  blue_4:  { x: 279.3, y: 277.0 },
  blue_5:  { x: 394.0, y: 321.0 },
  blue_6:  { x: 315.4, y: 357.9 },
  blue_7:  { x: 224.3, y: 374.0 },
  blue_8:  { x: 165.8, y: 455.0 },
  blue_9:  { x: 251.4, y: 457.8 },
  blue_10: { x: 346.1, y: 458.5 },
  blue_11: { x: 250.5, y: 533.4 },
  blue_12: { x: 169.3, y: 539.7 },

  // GREEN (right side)
  green_1:  { x: 632.9, y: 195.1 },
  green_2:  { x: 701.5, y: 231.9 },
  green_3:  { x: 583.3, y: 261.6 },
  green_4:  { x: 660.8, y: 304.9 },
  green_5:  { x: 743.0, y: 325.5 },
  green_6:  { x: 614.7, y: 396.3 },
  green_7:  { x: 706.0, y: 414.5 },
  green_8:  { x: 798.0, y: 411.9 },
  green_9:  { x: 708.7, y: 495.6 },
  green_10: { x: 789.9, y: 492.0 },
  green_11: { x: 858.4, y: 495.6 },
  green_12: { x: 804.4, y: 573.8 },

  // RED (bottom side)
  red_1:  { x: 527.4, y: 646.8 },
  red_2:  { x: 398.4, y: 678.3 },
  red_3:  { x: 666.2, y: 706.2 },
  red_4:  { x: 457.9, y: 718.8 },
  red_5:  { x: 280.3, y: 725.2 },
  red_6:  { x: 588.7, y: 736.7 },
  red_7:  { x: 352.3, y: 754.9 },
  red_8:  { x: 693.3, y: 762.0 },
  red_9:  { x: 417.4, y: 804.4 },
  red_10: { x: 522.8, y: 800.7 },
  red_11: { x: 635.6, y: 799.8 },
  red_12: { x: 324.4, y: 810.7 }
};

let pieces = [
  // BLUE
  { id: "b1", color: "blue", position: "blue_1", king: false },
  { id: "b2", color: "blue", position: "blue_2", king: false },
  { id: "b3", color: "blue", position: "blue_3", king: false },
  { id: "b4", color: "blue", position: "blue_4", king: false },
  { id: "b5", color: "blue", position: "blue_5", king: false },
  { id: "b6", color: "blue", position: "blue_6", king: false },
  { id: "b7", color: "blue", position: "blue_7", king: false },
  { id: "b8", color: "blue", position: "blue_8", king: false },
  { id: "b9", color: "blue", position: "blue_9", king: false },
  { id: "b10", color: "blue", position: "blue_10", king: false },
  { id: "b11", color: "blue", position: "blue_11", king: false },
  { id: "b12", color: "blue", position: "blue_12", king: false },

  // GREEN
  { id: "g1", color: "green", position: "green_1", king: false },
  { id: "g2", color: "green", position: "green_2", king: false },
  { id: "g3", color: "green", position: "green_3", king: false },
  { id: "g4", color: "green", position: "green_4", king: false },
  { id: "g5", color: "green", position: "green_5", king: false },
  { id: "g6", color: "green", position: "green_6", king: false },
  { id: "g7", color: "green", position: "green_7", king: false },
  { id: "g8", color: "green", position: "green_8", king: false },
  { id: "g9", color: "green", position: "green_9", king: false },
  { id: "g10", color: "green", position: "green_10", king: false },
  { id: "g11", color: "green", position: "green_11", king: false },
  { id: "g12", color: "green", position: "green_12", king: false },

  // RED
  { id: "r1", color: "red", position: "red_1", king: false },
  { id: "r2", color: "red", position: "red_2", king: false },
  { id: "r3", color: "red", position: "red_3", king: false },
  { id: "r4", color: "red", position: "red_4", king: false },
  { id: "r5", color: "red", position: "red_5", king: false },
  { id: "r6", color: "red", position: "red_6", king: false },
  { id: "r7", color: "red", position: "red_7", king: false },
  { id: "r8", color: "red", position: "red_8", king: false },
  { id: "r9", color: "red", position: "red_9", king: false },
  { id: "r10", color: "red", position: "red_10", king: false },
  { id: "r11", color: "red", position: "red_11", king: false },
  { id: "r12", color: "red", position: "red_12", king: false }
];

socket.on("roomCreated", (data) => {
  gameState.roomCode = data.code;
  gameState.players = data.players;
  gameState.isHost = true;
  renderLobby();
});

socket.on("roomUpdate", (data) => {
  if (gameState.roomCode) {
    gameState.players = data.players;
    
    if (data.hostId === socket.id) {
      gameState.isHost = true;
    }
    
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
  if (overlay) {
    overlay.remove();
  }
});

socket.on("gameStarted", () => {
  const overlay = document.getElementById("countdown-overlay");
  if (overlay) overlay.remove();

  showGame();
});

socket.on("errorMessage", (message) => {
  alert(`Error: ${message}`);
});

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
    if (gameState.roomCode) {
      socket.emit("leaveRoom");
    }

    gameState.roomCode = null;
    gameState.players = [];
    gameState.isHost = false;

    showMenu();
  }

  if (id === "readyBtn") {
    socket.emit("toggleReady");
  }

  if (id === "endBtn") showEndScreen();

  if (id === "menuBtn") {
    socket.emit("leaveRoom"); 
    gameState.roomCode = null;
    gameState.players = [];
    showMenu();
  }
});

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
  const canStart = playerCount === 3;

  const me = gameState.players.find(p => p.id === socket.id);

  let statusMessage = "";
  if (playerCount < 3) {
    statusMessage = `Waiting for ${playersNeeded} more player${playersNeeded > 1 ? 's' : ''}...`;
  } else {
    statusMessage = "Ready to begin!";
  }

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

    <button id="readyBtn" class="${me.ready ? 'active' : ''}">
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
    <input type="text" id="roomInput" maxlength="4" placeholder="CODE" style="text-transform: uppercase; font-size: 1.5rem; text-align: center; width: 150px; display: block; margin: 10px auto;">
    <button id="confirmJoinBtn">Join Room</button>
    <button id="backBtn">Back</button>
  `;
}

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
  svg.querySelectorAll(".checker-piece").forEach((el) => el.remove());

  for (const piece of pieces) {
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