const content = document.getElementById("content");
const menu = document.getElementById("menu");
const socket = io();

let gameState = {
  isHost: false,
  players: [],
  roomCode: null
};

socket.on("roomCreated", (data) => {
  gameState.roomCode = data.code;
  gameState.players = data.players;
  gameState.isHost = true;
  renderLobby();
});

socket.on("roomUpdate", (data) => {
  gameState.players = data.players;
  renderLobby();
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
  if (id === "backBtn") {
    if (gameState.roomCode) {
      socket.emit("leaveRoom");
      gameState.roomCode = null;
      gameState.players = [];
      gameState.isHost = false;
      showLobby();
    } else {
      showMenu();
    }
  }
  if (id === "simulateJoinBtn") simulatePlayerJoin();
  if (id === "startBtn") {
    if (gameState.players.length === 3) showGame();
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
  gameState.isHost = true;
  gameState.players = ["You (Host)"];
  socket.emit("createRoom");
}

function renderLobby() {
  const playerCount = gameState.players.length;
  const playersNeeded = 3 - playerCount;
  const canStart = playerCount === 3;

  let statusMessage = playerCount < 3 
    ? `Waiting for ${playersNeeded} more player${playersNeeded > 1 ? 's' : ''}...` 
    : "All players connected! Ready to start.";

  content.innerHTML = `
    <h2>Game Lobby</h2>
    <div class="lobby-card">
      <p>Room Code: <strong style="letter-spacing: 2px; color: #2ecc71;">${gameState.roomCode}</strong></p>
      <p id="status-text">${statusMessage}</p>
      <div class="progress-bar">
        Connected: ${playerCount}/3
      </div>
    </div>

    <ul class="player-list">
      ${gameState.players.map((p, index) => `<li>Player ${index + 1} ${p.id === socket.id ? '(You)' : ''}</li>`).join("")}
    </ul>

    <button id="startBtn" ${canStart ? "" : "disabled"}>Start Game</button>
    <button id="backBtn">Cancel & Leave</button>
  `;
}

function simulatePlayerJoin() {
  if (gameState.players.length < 3) {
    const newPlayerNumber = gameState.players.length + 1;
    gameState.players.push(`Player ${newPlayerNumber}`);
    renderLobby();
  }
}

function joinGame() {
  const ip = prompt("Enter host IP address:");
  if (!ip) return;
  gameState.isHost = false;
  content.innerHTML = `
    <h2>Connecting to ${ip}...</h2>
    <p>Connection successful (simulated).</p>
    <button id="enterBtn">Enter Game</button>
    <button id="backBtn">Back</button>
  `;
  document.getElementById("enterBtn").addEventListener("click", showGame);
}

function showGame() {
  content.innerHTML = `
    <h2>Game Started</h2>
    <p>Game board will render here.</p>
    <button id="endBtn">End Game (Simulate)</button>
  `;
}

function showEndScreen() {
  content.innerHTML = `
    <h2>Game Over</h2>
    <p>Winner: Player X (placeholder)</p>
    <button id="menuBtn">Return to Menu</button>
  `;
}