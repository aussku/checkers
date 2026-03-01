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

  if (id === "startBtn") {
    if (gameState.players.length === 3) {
      showGame(); 
    }
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
        <li>Player ${i + 1} ${p.id === socket.id ? "<strong>(You)</strong>" : ""}</li>
      `).join("")}
    </ul>

    ${gameState.isHost 
      ? `<button id="startBtn" ${canStart ? "" : "disabled"}>Start Game</button>` 
      : `<p><i>Waiting for the host to start the game...</i></p>`
    }
    
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