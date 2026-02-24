const content = document.getElementById("content");
const menu = document.getElementById("menu");

let gameState = {
  isHost: false,
  players: []
};

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

  document.getElementById("hostBtn").addEventListener("click", hostGame);
  document.getElementById("joinBtn").addEventListener("click", joinGame);
  document.getElementById("backBtn").addEventListener("click", showMenu);
}

function showRules() {
  menu.style.display = "none";

  content.innerHTML = `
    <h2>Rules</h2>
    <p>3 Player Checkers rules will be defined here.</p>
    <button id="backBtn">Back</button>
  `;

  document.getElementById("backBtn").addEventListener("click", showMenu);
}

function showSettings() {
  menu.style.display = "none";

  content.innerHTML = `
    <h2>Settings</h2>
    <p>Settings placeholder (board size, timer, etc.)</p>
    <button id="backBtn">Back</button>
  `;

  document.getElementById("backBtn").addEventListener("click", showMenu);
}

function hostGame() {
  gameState.isHost = true;
  gameState.players = ["You (Host)"];

  renderLobby();
}

function renderLobby() {
  const playerCount = gameState.players.length;
  const canStart = playerCount === 3;

  content.innerHTML = `
    <h2>Hosting Game...</h2>
    <p>Waiting for players to join...</p>
    <p>Connected players: ${playerCount}/3</p>

    <ul>
      ${gameState.players.map(p => `<li>${p}</li>`).join("")}
    </ul>

    <button id="simulateJoinBtn">Simulate Player Join</button>
    <button id="startBtn" ${canStart ? "" : "disabled"}>Start Game</button>
    <button id="backBtn">Cancel</button>
  `;

  document.getElementById("simulateJoinBtn")
    .addEventListener("click", simulatePlayerJoin);

  document.getElementById("startBtn")
    .addEventListener("click", () => {
      if (gameState.players.length === 3) {
        showGame();
      }
    });

  document.getElementById("backBtn")
    .addEventListener("click", showLobby);
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
  document.getElementById("backBtn").addEventListener("click", showLobby);
}

function showGame() {
  content.innerHTML = `
    <h2>Game Started</h2>
    <p>Game board will render here.</p>
    <button id="endBtn">End Game (Simulate)</button>
  `;

  document.getElementById("endBtn").addEventListener("click", showEndScreen);
}

function showEndScreen() {
  content.innerHTML = `
    <h2>Game Over</h2>
    <p>Winner: Player X (placeholder)</p>
    <button id="menuBtn">Return to Menu</button>
  `;

  document.getElementById("menuBtn").addEventListener("click", showMenu);
}

document.getElementById("playBtn").addEventListener("click", showLobby);
document.getElementById("rulesBtn").addEventListener("click", showRules);
document.getElementById("settingsBtn").addEventListener("click", showSettings);
