const content = document.getElementById("content");
const menu = document.getElementById("menu");
const socket = io();

let gameState = {
  isHost: false,
  players: [],
  roomCode: null,
};

const DEFAULT_PLAYER_SETTINGS = {
  name: "Player",
  color: "blue",
  showValidMoves: true,
};

let playerSettings = loadPlayerSettings();

// Board state is owned by the server. This is a local rendering copy only.
let boardState = null;
let selectedPieceId = null;
let highlightedMoves = [];
let invalidPieceId = null;
let invalidMoveTimer = null;
let lobbyAlert = null;
let chatMessages = [];
let gameLogEvents = [];

function getCurrentTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light-theme');
  } else {
    root.classList.remove('light-theme');
  }
}

setTheme(getCurrentTheme());

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
  chatMessages = Array.isArray(data.chatMessages) ? data.chatMessages : [];
  gameLogEvents = [];
  showGame();
});

socket.on("chatMessage", (message) => {
  chatMessages.push(message);
  renderChatMessages();
});


socket.on('gameLogUpdate', (events) => {
  gameLogEvents = Array.isArray(events) ? events : [];
  updateLogUI(events);
});

function formatLogText(event) {
  const d = event.details || {};
  if (event.type === 'move') {
    let text = `${event.player} moved ${d.pieceId} from ${d.from} to ${d.to}`;
    if (d.captured) {
      text += ` capturing ${d.captured}`;
    }
    return text;
  }

  switch (event.type) {
    case 'capture':
      return `${event.player} captured ${d.capturedPiece} with ${d.pieceId} at ${d.position}`;
    case 'promotion':
      return `${event.player} promoted ${d.pieceId} from ${d.fromType} to ${d.toType} at ${d.position}`;
    case 'turnSkip':
      return `${event.player} skipped a turn${d.reason ? ` (${d.reason})` : ''}`;
    case 'elimination':
      return `${event.player} eliminated ${d.eliminatedPlayer}${d.reason ? ` (${d.reason})` : ''}`;
    default:
      return `${event.player} ${event.type}: ${JSON.stringify(d)}`;
  }
}

function getPlayerColor(event) {
  return event.playerColor
    || gameState.players?.find(p => p.name === event.player)?.color
    || DEFAULT_PLAYER_SETTINGS.color;
}

function updateLogUI(events) {
  const container = document.getElementById('log-container');
  if (!container) return;
  container.innerHTML = '';

  events.forEach((event) => {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.style.borderLeft = `4px solid ${getPlayerColor(event)}`;
    entry.textContent = formatLogText(event);
    container.appendChild(entry);
  });

  container.scrollTop = container.scrollHeight;
}

// Full state push after any server-side mutation (moves, captures, etc.)
socket.on("gameState", (state) => {
  console.log("Game state received:", state);
  boardState = state;
  invalidPieceId = null;

  if (selectedPieceId) {
    const stillExists = boardState.pieces.some(p => p.id === selectedPieceId);
    if (!stillExists) {
      selectedPieceId = null;
      highlightedMoves = [];
    }
  }

  const svg = document.querySelector("#boardContainer svg");
  if (svg) {
    syncMoveHighlights();
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

socket.on("validMoves", ({ pieceId, moves }) => {
  if (pieceId !== selectedPieceId) return;

  highlightedMoves = Array.isArray(moves) ? moves : [];

  const svg = document.querySelector("#boardContainer svg");
  if (svg) {
    renderCellTargets(svg);
    renderPieces(svg);
  }
});

socket.on("rematchVoteUpdate", ({ acceptedCount, total }) => {
  const status = document.getElementById("rematchStatus");
  if (status && status.textContent.includes("Waiting")) {
    status.textContent = `Waiting for other players... (${acceptedCount}/${total} ready)`;
  }
});

socket.on("rematchDeclined", () => {
  if (boardState && boardState.status === "finished") {
    boardState = null; 
    lobbyAlert = "A player declined or left. Rematch cancelled.";
  }
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
      socket.emit("joinRoom", {
        code,
        playerSettings: getBackendPlayerSettings(),
      });
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

  if (id === "acceptRematchBtn") {
    socket.emit("voteRematch", true);
    document.getElementById("acceptRematchBtn").style.display = "none";
    document.getElementById("declineRematchBtn").style.display = "none";
    document.getElementById("rematchStatus").textContent = "Waiting for other players...";
  }

  if (id === "declineRematchBtn") {
    socket.emit("voteRematch", false);
  }

  if (id === "sendChatBtn") {
    sendChatMessage();
  }
});

content.addEventListener("submit", (e) => {
  if (e.target.id === "chatForm") {
    e.preventDefault();
    sendChatMessage();
    return;
  }

  if (e.target.id === "settingsForm") {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nextSettings = {
      name: (formData.get("playerName") || "").toString().trim(),
      color: (formData.get("playerColor") || DEFAULT_PLAYER_SETTINGS.color).toString(),
      showValidMoves: formData.has("showValidMoves"),
    };

    savePlayerSettings(nextSettings);

    const darkMode = formData.get("darkMode") === "on";
    setTheme(darkMode ? 'dark' : 'light');

    if (gameState.roomCode) {
      socket.emit("updatePlayerSettings", getBackendPlayerSettings());
    }

    syncMoveHighlights();
    const svg = document.querySelector("#boardContainer svg");
    if (svg) {
      renderCellTargets(svg);
      renderPieces(svg);
    }

    const status = document.getElementById("settingsStatus");
    if (status) status.textContent = "Settings saved.";
  }
});

// ---------------------------------------------------------------------------
// Screen renderers
// ---------------------------------------------------------------------------

function loadPlayerSettings() {
  try {
    const savedSettings = JSON.parse(localStorage.getItem("playerSettings") || "{}");
    return normalizePlayerSettings(savedSettings);
  } catch (error) {
    return { ...DEFAULT_PLAYER_SETTINGS };
  }
}

function normalizePlayerSettings(settings) {
  const validColors = ["blue", "green", "red"];
  const name = typeof settings.name === "string" ? settings.name.trim().slice(0, 20) : "";
  const color = validColors.includes(settings.color) ? settings.color : DEFAULT_PLAYER_SETTINGS.color;

  return {
    name: name || DEFAULT_PLAYER_SETTINGS.name,
    color,
    showValidMoves: settings.showValidMoves !== false,
  };
}

function savePlayerSettings(nextSettings) {
  playerSettings = normalizePlayerSettings(nextSettings);
  localStorage.setItem("playerSettings", JSON.stringify(playerSettings));
}

function getBackendPlayerSettings() {
  return {
    name: playerSettings.name,
    color: playerSettings.color,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatChatTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getChatSidebarMarkup() {
  return `
    <aside class="game-sidebar">
      <section class="chat-panel">
        <div class="sidebar-section-header">
          <h3>Game Chat</h3>
          <span class="sidebar-section-meta">${chatMessages.length} message${chatMessages.length === 1 ? "" : "s"}</span>
        </div>
        <div id="chatMessages" class="chat-messages"></div>
        <form id="chatForm" class="chat-form">
          <input id="chatInput" name="chatInput" type="text" maxlength="240" placeholder="Type a message..." autocomplete="off">
          <button id="sendChatBtn" type="submit">Send</button>
        </form>
      </section>
      <section id="move-log" class="move-log sidebar-panel">
        <div class="sidebar-section-header">
          <h3>Move Log</h3>
        </div>
        <div id="log-container" class="log-container"></div>
      </section>
    </aside>
  `;
}

function renderChatMessages() {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  if (!chatMessages.length) {
    container.innerHTML = `<p class="chat-empty">No messages yet. Say hello to the room.</p>`;
  } else {
    container.innerHTML = chatMessages.map((message) => `
      <article class="chat-message">
        <div class="chat-message-meta">
          <span class="chat-sender" style="color: ${escapeHtml(message.playerColor || DEFAULT_PLAYER_SETTINGS.color)};">
            ${escapeHtml(message.playerName || "Player")}
          </span>
          <span class="chat-timestamp">${escapeHtml(formatChatTimestamp(message.timestamp))}</span>
        </div>
        <p class="chat-text">${escapeHtml(message.text || "")}</p>
      </article>
    `).join("");
  }

  const meta = document.querySelector(".chat-panel .sidebar-section-meta");
  if (meta) {
    meta.textContent = `${chatMessages.length} message${chatMessages.length === 1 ? "" : "s"}`;
  }

  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  socket.emit("sendChatMessage", { text });
  input.value = "";
  input.focus();
}

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
  const colorOptions = ["blue", "green", "red"];

  menu.style.display = "none";
  content.style.display = "block";
  content.innerHTML = `
    <h2>Settings</h2>
    <form id="settingsForm" class="settings-panel">
      <label class="settings-field" for="playerName">
        <span>Player name</span>
        <input id="playerName" name="playerName" type="text" maxlength="20"
          value="${escapeHtml(playerSettings.name)}" placeholder="Player">
      </label>

      <fieldset class="settings-field">
        <legend>Player color</legend>
        <div class="color-options">
          ${colorOptions.map(color => `
            <label class="color-option ${color}">
              <input type="radio" name="playerColor" value="${color}"
                ${playerSettings.color === color ? "checked" : ""}>
              <span class="color-swatch"></span>
              <span>${getPlayerLabelByColor(color)}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <label class="toggle-row">
        <input type="checkbox" name="showValidMoves"
          ${playerSettings.showValidMoves ? "checked" : ""}>
        <span>Highlight valid moves</span>
      </label>

      <label class="toggle-row">
        <input type="checkbox" name="darkMode" id="darkModeToggle"
          ${getCurrentTheme() === 'dark' ? 'checked' : ''}>
        <span>Dark Mode</span>
      </label>

      <p id="settingsStatus" class="settings-status" aria-live="polite"></p>
      <button type="submit" id="saveSettingsBtn">Save Settings</button>
    </form>
    <button id="backBtn">Back</button>
  `;
}

function hostGame() {
  socket.emit("createRoom", getBackendPlayerSettings());
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
    ${lobbyAlert ? `<div style="background: #e74c3c; color: white; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-weight: bold;">${lobbyAlert}</div>` : ""}
    <h2>Game Lobby</h2>
    <div class="lobby-info">
      <p>Room Code: <strong style="color: #2ecc71;">${gameState.roomCode}</strong></p>
      <p>${statusMessage}</p>
      <p>Connected: ${playerCount}/3</p>
    </div>
    <ul class="player-list">
      ${gameState.players.map((p, i) => `
        <li>
          <span class="ready-state">${p.ready ? "Ready" : "Waiting"}</span>
          <span class="player-color-dot ${p.color || "blue"}"></span>
          <span>${escapeHtml(p.name || `Player ${i + 1}`)}</span>
          ${p.id === socket.id ? "<strong>(You)</strong>" : ""}
        </li>
      `).join("")}
    </ul>
    <button id="readyBtn" class="${me.ready ? "active" : ""}">
      ${me.ready ? "Unready" : "Ready Up"}
    </button>
    <button id="backBtn">Leave Lobby</button>
  `;

  lobbyAlert = null;
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

function shouldShowMoveHighlights() {
  return !!playerSettings.showValidMoves && !!selectedPieceId && isMyTurn();
}

function syncMoveHighlights() {
  if (!shouldShowMoveHighlights()) {
    highlightedMoves = [];
    return;
  }

  highlightedMoves = [];
  socket.emit("requestValidMoves", {
    roomCode: gameState.roomCode,
    pieceId: selectedPieceId,
  });
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
    highlightedMoves = [];
  } else {
    selectedPieceId = pieceId;
  }

  syncMoveHighlights();
  renderCellTargets(svg);
  renderPieces(svg);
}

function renderCellTargets(svg) {
  svg.querySelectorAll(".board-cell-target, .board-cell-highlight").forEach(el => el.remove());

  Object.entries(boardPositions).forEach(([position, pos]) => {
    if (highlightedMoves.includes(position)) {
      const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      ring.setAttribute("class", "board-cell-highlight");
      ring.setAttribute("cx", pos.x);
      ring.setAttribute("cy", pos.y);
      ring.setAttribute("r", 11);
      ring.setAttribute("fill", "rgba(255, 215, 0, 0.28)");
      ring.setAttribute("stroke", "#ffd700");
      ring.setAttribute("stroke-width", "3");
      ring.setAttribute("pointer-events", "none");
      svg.appendChild(ring);
    }

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

function getPlayerByColor(color) {
  if (!boardState || !boardState.colorAssignments) return null;
  const playerId = Object.entries(boardState.colorAssignments)
    .find(([, assignedColor]) => assignedColor === color)?.[0];

  if (!playerId) return null;

  return {
    id: playerId,
    color,
    name: boardState.playerMeta?.[playerId]?.name || getPlayerLabelByColor(color),
  };
}

function getPlayerLabel(playerId) {
  if (!boardState) return "Player";
  const color = boardState.colorAssignments?.[playerId];
  const fallback = color ? getPlayerLabelByColor(color) : "Player";
  return boardState.playerMeta?.[playerId]?.name || fallback;
}

function renderScoreboard() {
  const scoreboard = document.getElementById("scoreboard");
  if (!scoreboard || !boardState || !boardState.pieceCounts) return;

  const eliminated = new Map((boardState.eliminatedPlayers || []).map(entry => [entry.color, entry.place]));
  const colors = ["blue", "green", "red"];

  scoreboard.innerHTML = colors.map(color => {
    const place = eliminated.get(color);
    const player = getPlayerByColor(color);
    const suffix = place ? `${place}${place === 1 ? "st" : place === 2 ? "nd" : "rd"}` : "Active";
    return `
      <div class="score-chip ${color}${place ? " eliminated" : ""}">
        <span class="score-dot"></span>
        <span class="score-name">${escapeHtml(player?.name || getPlayerLabelByColor(color))}</span>
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
    turnText.textContent = `${getPlayerLabel(currentPlayerId)}'s Turn`;
  }

  turnText.style.color = currentColor;
  turnIndicator.style.borderColor = currentColor;
  turnIndicator.style.boxShadow = `0 0 20px ${currentColor}, 0 4px 12px var(--shadow)`;
}

async function showGame() {
  content.style.display = "block";
  content.innerHTML = `
    <div class="game-layout">
      <section class="game-main-panel">
        <h2>Game Started</h2>
        <div id="turnIndicator">
          <span id="turnText">Waiting for turn info...</span>
        </div>
        <div id="scoreboard"></div>
        <div id="moveFeedback" class="move-feedback"></div>
        <div id="boardContainer"></div>
        <div class="game-actions">
          <button id="endBtn">End Game (Simulate)</button>
        </div>
      </section>
      ${getChatSidebarMarkup()}
    </div>
  `;

  const response = await fetch("./assets/board.svg");
  const svgText = await response.text();

  document.getElementById("boardContainer").innerHTML = svgText;

  const svg = document.querySelector("#boardContainer svg");
  syncMoveHighlights();
  renderCellTargets(svg);
  renderPieces(svg);
  renderScoreboard();
  updateTurnDisplay();
  renderChatMessages();
  updateLogUI(gameLogEvents);
}

function showEndScreen() {
  content.style.display = "block";
  const rankings = (boardState?.rankings || []).slice().sort((a, b) => a.place - b.place);
  const winner = rankings.find(entry => entry.place === 1);
  
  const winnerName = winner ? escapeHtml(getPlayerLabel(winner.playerId)) : "Unknown";
  const winnerColor = winner ? winner.color : "";
  
  content.innerHTML = `
    <div class="game-layout game-layout-end">
      <section class="game-main-panel end-screen-panel">
        <h2>Game Over</h2>
        <p>Winner: <strong style="color: ${winnerColor};">${winnerName}</strong></p>
        <div class="final-rankings">
          ${rankings.map(entry => {
            const isMe = entry.playerId === socket.id;
            const colorName = entry.color.charAt(0).toUpperCase() + entry.color.slice(1);
            return `
              <p style="font-size: 1.1rem; margin: 5px 0; color: ${entry.color};">
                <strong>${entry.place}.</strong> ${escapeHtml(getPlayerLabel(entry.playerId))}
                <span style="opacity: 0.8; font-size: 0.9em;">(${colorName})</span>
                ${isMe ? " <strong>(You)</strong>" : ""}
              </p>
            `;
          }).join("")}
        </div>
        <div id="rematchContainer" class="rematch-panel">
          <p id="rematchStatus">Would you like a rematch?</p>
          <div class="game-actions">
            <button id="acceptRematchBtn" style="background: #2ecc71; color: white;">Accept Rematch</button>
            <button id="declineRematchBtn" style="background: #e74c3c; color: white;">Decline</button>
          </div>
        </div>
        <div class="game-actions">
          <button id="menuBtn">Leave Room</button>
        </div>
      </section>
      ${getChatSidebarMarkup()}
    </div>
  `;

  renderChatMessages();
  updateLogUI(gameLogEvents);
}

