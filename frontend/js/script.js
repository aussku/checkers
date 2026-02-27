const content = document.getElementById("content");
const menu = document.getElementById("menu");
const socket = io();

let gameState = {
  isHost: false,
  players: [],
  roomCode: null
};

socket.on("roomCreated", (room) => {
  console.log("Room created:", room);
  gameState.roomCode = room.code;
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
    if (gameState.roomCode || menu.style.display === "none") {
      showMenu();
    }
  }
  if (id === "simulateJoinBtn") simulatePlayerJoin();
  if (id === "startBtn") {
    if (gameState.players.length === 3) showGame();
  }
  if (id === "endBtn") showEndScreen();
  if (id === "menuBtn") {
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
  const canStart = playerCount === 3;

  content.innerHTML = `
    <h2>Hosting Game...</h2>
    <p>Room Code: <strong>${gameState.roomCode || "..."}</strong></p>
    <p>Connected players: ${playerCount}/3</p>
    <ul>
      ${gameState.players.map(p => `<li>${p}</li>`).join("")}
    </ul>
    <button id="simulateJoinBtn">Simulate Player Join</button>
    <button id="startBtn" ${canStart ? "" : "disabled"}>Start Game</button>
    <button id="backBtn">Cancel</button>
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