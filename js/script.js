// Global Variables
let gameActive = false;
let discount = 1.00;       // Current discount (starts at 1.00%)
let totalDiscount = 0.00;  // Total discount won
let crashTime;             // Random crash time (in ms)
let startTime;             // Timestamp when the run begins
let tickTimer;
let gameInterval;
const tickInterval = 50;   // 50 ms per tick
let cashedOut = false;
let playerBet = false;     // True if player clicked Blast Off during the countdown
let countdownInterval;

// DOM Elements
const statusDisplay = document.getElementById("status");
const currentDisplay = document.getElementById("current-discount");
const totalDisplay = document.getElementById("discount-display");
const countdownDisplay = document.getElementById("countdown");
const blastBtn = document.getElementById("blastOff");
const cashBtn = document.getElementById("cashOut");
const rocketWrapper = document.getElementById("rocket-wrapper");

// Start a countdown between rounds
function startCountdown() {
  let count = 5;
  countdownDisplay.textContent = count;
  countdownDisplay.style.display = "block";
  blastBtn.disabled = false; // Allow betting during countdown
  cashBtn.disabled = true;
  // Reset player bet flag for the new round.
  playerBet = false;
  
  countdownInterval = setInterval(() => {
    count--;
    countdownDisplay.textContent = count;
    if (count === 0) {
      clearInterval(countdownInterval);
      countdownDisplay.style.display = "none";
      startRound();
    }
  }, 1000);
}

// Start a new round (run)
function startRound() {
  // Initialize run variables.
  discount = 1.00;
  cashedOut = false;
  gameActive = true;
  // Generate a random crash time between 3 and 6 seconds.
  crashTime = Math.random() * 3000 + 3000;
  startTime = Date.now();
  
  statusDisplay.textContent = "Run in progress..." + (playerBet ? " Cash Out to secure your discount!" : " (No bet placed)");
  cashBtn.disabled = playerBet ? false : true;
  
  // Reset rocket position: horizontal position starts at far left.
  rocketWrapper.style.left = "0px";
  
  // Start game loop.
  gameInterval = setInterval(updateGame, tickInterval);
  tickTimer = setInterval(updateDiscount, tickInterval);
}

// Game loop: update the UI (rocket position and discount)
function updateGame() {
  if (!gameActive) return;
  updateUI();
}

// Increase discount, move rocket, and check for crash.
function updateDiscount() {
  if (!gameActive) return;
  
  // Increase discount by 0.01% per tick.
  discount += 0.01;
  if (discount > 20) discount = 20;
  
  // Update elapsed time.
  let elapsed = Date.now() - startTime;
  
  // Check for crash (if player bet).
  if (playerBet && elapsed >= crashTime) {
    crash();
    return;
  }
  
  updateUI();
}

// Update UI elements.
function updateUI() {
  updateDiscountDisplay();
  updateRocketPosition();
  updateBottomScale();
  updateVerticalTicker();
}

// Update displayed discount values.
function updateDiscountDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
  document.getElementById("current-discount").textContent = "Current: " + discount.toFixed(2) + "%";
  // (Risk color classes can be added here if desired)
}

// Move the rocket horizontally.
// At 1.00%, rocket is at far left; at 20%, rocket is centered.
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const containerWidth = container.offsetWidth;
  const rocketWidth = rocketWrapper.offsetWidth;
  const maxLeft = (containerWidth - rocketWidth) / 2; // when centered
  let t = (discount - 1) / (20 - 1); // Normalize discount from 1 to 20.
  let pos = t * maxLeft;
  rocketWrapper.style.left = pos + "px";
}

// Update horizontal tick bar (linear mapping 0%-20%).
function updateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = "";
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  const ticks = [0, 5, 10, 15, 20];
  ticks.forEach(val => {
    let pos = (val / 20) * containerWidth;
    let tick = document.createElement("div");
    tick.className = "tick";
    tick.style.left = pos + "px";
    bottomScale.appendChild(tick);
    let label = document.createElement("div");
    label.className = "tick-label";
    label.textContent = val + "%";
    label.style.left = (pos - 10) + "px";
    bottomScale.appendChild(label);
  });
  let marker = document.createElement("div");
  marker.className = "tick-marker";
  let rocketCenter = parseFloat(rocketWrapper.style.left) + (rocketWrapper.offsetWidth / 2);
  marker.style.left = rocketCenter + "px";
  bottomScale.appendChild(marker);
}

// Update vertical tick bar (linear mapping 0%-20%).
function updateVerticalTicker() {
  const verticalTicker = document.getElementById("vertical-ticker");
  verticalTicker.innerHTML = "";
  const containerHeight = document.getElementById("rocket-container").offsetHeight;
  const ticks = [0, 5, 10, 15, 20];
  ticks.forEach(val => {
    let pos = (1 - (val / 20)) * containerHeight;
    let tick = document.createElement("div");
    tick.className = "v-tick";
    tick.style.top = pos + "px";
    verticalTicker.appendChild(tick);
    let label = document.createElement("div");
    label.className = "v-tick-label";
    label.textContent = val + "%";
    label.style.top = (pos - 5) + "px";
    verticalTicker.appendChild(label);
  });
  let marker = document.createElement("div");
  marker.className = "v-tick-marker";
  let rocketCenter = rocketWrapper.offsetTop + (rocketWrapper.offsetHeight / 2);
  marker.style.top = rocketCenter + "px";
  verticalTicker.appendChild(marker);
}

// When the rocket crashes.
function crash() {
  clearInterval(gameInterval);
  clearInterval(tickTimer);
  gameActive = false;
  crashed = true;
  // If the player bet and did not cash out, they lose all discount.
  if (playerBet) {
    discount = 0;
    totalDiscount = 0;
  }
  const rocketSound = document.getElementById("rocket-sound");
  rocketSound.pause();
  rocketSound.currentTime = 0;
  document.getElementById("explosion-sound").play();
  rocketWrapper.style.display = "none";
  const explosionElem = document.getElementById("explosion");
  explosionElem.style.left = rocketWrapper.style.left;
  explosionElem.style.bottom = rocketWrapper.style.bottom;
  explosionElem.style.display = "block";
  explosionElem.classList.add("explode");
  document.getElementById("status").textContent = "Run crashed! Discount lost!";
  document.getElementById("cashOut").disabled = true;
  document.getElementById("blastOff").disabled = true;
  updateLeaderboard();
  setTimeout(startCountdown, 2000);
}

// When the player cashes out.
function cashOut() {
  if (!gameActive || crashed || !playerBet) return;
  clearInterval(gameInterval);
  clearInterval(tickTimer);
  gameActive = false;
  const cashoutSound = document.getElementById("cashout-sound");
  cashoutSound.volume = parseFloat(document.getElementById("cashout-volume").value);
  cashoutSound.play();
  const rocketSound = document.getElementById("rocket-sound");
  rocketSound.pause();
  rocketSound.currentTime = 0;
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "%!";
  document.getElementById("cashOut").disabled = true;
  document.getElementById("blastOff").disabled = true;
  totalDiscount += discount;
  updateAccumulatedDisplay();
  updateUI();
  updateLeaderboard();
  showShareOptions();
  setTimeout(startCountdown, 2000);
}

// Update total discount display.
function updateAccumulatedDisplay() {
  totalDisplay.textContent = "Total Discount: " + totalDiscount.toFixed(2) + "%";
}

// Update leaderboard display.
function updateLeaderboard() {
  let highScore = parseFloat(localStorage.getItem("highScore")) || 0;
  if (totalDiscount > highScore) {
    highScore = totalDiscount;
    localStorage.setItem("highScore", highScore.toFixed(2));
  }
  document.getElementById("leaderboard").innerHTML = "High Score: " + highScore.toFixed(2) + "%";
}

// Show share options (placeholder).
function showShareOptions() {
  document.getElementById("share-area").innerHTML =
    '<p>Share your score:</p>' +
    '<button onclick="alert(\'Shared on Twitter!\')">Twitter</button> ' +
    '<button onclick="alert(\'Shared on Facebook!\')">Facebook</button>';
}

// -------------------- Countdown Between Rounds --------------------
function startCountdown() {
  // Show countdown before each round.
  let count = 5;
  document.getElementById("countdown").textContent = count;
  document.getElementById("countdown").style.display = "block";
  // During countdown, enable Blast Off button.
  blastBtn.disabled = false;
  // Reset player bet flag.
  playerBet = false;
  // Disable Cash Out during countdown.
  cashBtn.disabled = true;
  
  countdownInterval = setInterval(() => {
    count--;
    document.getElementById("countdown").textContent = count;
    if (count <= 0) {
      clearInterval(countdownInterval);
      document.getElementById("countdown").style.display = "none";
      // Once countdown ends, start the round.
      startRound();
    }
  }, 1000);
}

// -------------------- Round Initialization --------------------
function startRound() {
  // Start a new round.
  blastBtn.disabled = true; // Prevent further clicks.
  startGame();
}

// -------------------- Event Listeners --------------------
window.addEventListener("load", () => {
  updateLeaderboard();
  startCountdown();
});

blastBtn.addEventListener("click", () => {
  // Player clicks Blast Off during the countdown.
  clearInterval(countdownInterval);
  document.getElementById("countdown").style.display = "none";
  playerBet = true;
  cashBtn.disabled = false;
  startRound();
});

cashBtn.addEventListener("click", cashOut);

document.getElementById("bg-volume").addEventListener("input", () => {
  document.getElementById("bg-music").volume = parseFloat(document.getElementById("bg-volume").value);
});

document.getElementById("sfx-volume").addEventListener("input", () => {
  document.getElementById("explosion-sound").volume = parseFloat(document.getElementById("sfx-volume").value);
  document.getElementById("rocket-sound").volume = parseFloat(document.getElementById("sfx-volume").value);
});

document.getElementById("cashout-volume").addEventListener("input", () => {
  document.getElementById("cashout-sound").volume = parseFloat(document.getElementById("cashout-volume").value);
});
