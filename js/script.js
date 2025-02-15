// Global Variables
let discount = 0.00;      // Current discount (starts at 0.00%)
let totalDiscount = 0.00; // Total accumulated discount
let gameActive = false;
let crashed = false;
let playerJoined = false; // True if "Blast Off" is clicked (i.e. player bets)
let gameInterval;
let tickInterval = 50;    // milliseconds per tick
let tickTimer;

// -------------------- Utility Functions --------------------

// Update the displayed current discount and apply risk color classes.
function updateDiscountDisplay() {
  const shipElem = document.getElementById("ship-discount");
  const currentElem = document.getElementById("current-discount");
  shipElem.textContent = discount.toFixed(2) + "% Discount";
  currentElem.textContent = "Current: " + discount.toFixed(2) + "%";
  
  shipElem.classList.remove("low-risk", "mid-risk", "high-risk");
  currentElem.classList.remove("low-risk", "mid-risk", "high-risk");
  if (discount < 5) {
    shipElem.classList.add("low-risk");
    currentElem.classList.add("low-risk");
  } else if (discount < 10) {
    shipElem.classList.add("mid-risk");
    currentElem.classList.add("mid-risk");
  } else {
    shipElem.classList.add("high-risk");
    currentElem.classList.add("high-risk");
  }
}

// Update the rocket's horizontal position: at 0% it's at the left edge,
// and at 20% it is centered horizontally.
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  // Calculate maximum left position so that when centered, left = (containerWidth - wrapperWidth) / 2.
  const maxLeft = (containerWidth - wrapperWidth) / 2;
  // Map discount (0% to 20%) linearly to horizontal position from 0 to maxLeft.
  let t = discount / 20;
  rocketWrapper.style.left = (t * maxLeft) + "px";
  // Keep rocket at bottom
  rocketWrapper.style.bottom = "0px";
}

// Update the horizontal tick bar using a linear mapping (0%–20%).
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
  const rocketWrapper = document.getElementById("rocket-wrapper");
  let marker = document.createElement("div");
  marker.className = "tick-marker";
  let rocketCenter = parseFloat(rocketWrapper.style.left) + (rocketWrapper.offsetWidth / 2);
  marker.style.left = rocketCenter + "px";
  bottomScale.appendChild(marker);
}

// Update the vertical tick bar (linear from 0% at bottom to 20% at top).
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
  const rocketWrapper = document.getElementById("rocket-wrapper");
  let marker = document.createElement("div");
  marker.className = "v-tick-marker";
  let rocketCenter = rocketWrapper.offsetTop + (rocketWrapper.offsetHeight / 2);
  marker.style.top = rocketCenter + "px";
  verticalTicker.appendChild(marker);
}

// Update all UI elements.
function updateUI() {
  updateDiscountDisplay();
  updateRocketPosition();
  updateBottomScale();
  updateVerticalTicker();
}

// Update the leaderboard display.
function updateLeaderboard() {
  let highScore = parseFloat(localStorage.getItem("highScore")) || 0;
  if (totalDiscount > highScore) {
    highScore = totalDiscount;
    localStorage.setItem("highScore", highScore.toFixed(2));
  }
  document.getElementById("leaderboard").innerHTML = "High Score: " + highScore.toFixed(2) + "%";
}

// Update the total discount display.
function updateAccumulatedDisplay() {
  document.getElementById("discount-display").textContent = "Total Discount: " + totalDiscount.toFixed(2) + "%";
}

// -------------------- Game Mechanics --------------------

// Every tick, increase discount by 0.01% and check for explosion.
function updateDiscount() {
  if (!gameActive) return;
  discount += 0.01;
  if (discount > 20) discount = 20;
  
  // Explosion probability per tick:
  // 0%-5%: ~80% overall chance over ~500 ticks ⇒ 0.00402 per tick
  // 5%-10%: ~10% overall chance over ~500 ticks ⇒ 0.0002 per tick
  // 10%-20%: ~2% overall chance over ~1000 ticks ⇒ 0.00002 per tick
  let explosionProb = 0;
  if (discount < 5) {
    explosionProb = 0.00402;
  } else if (discount < 10) {
    explosionProb = 0.0002;
  } else {
    explosionProb = 0.00002;
  }
  
  if (Math.random() < explosionProb) {
    crash();
    return;
  }
  
  updateUI();
}

// Called repeatedly to update the game UI.
function updateGame() {
  if (!gameActive) return;
  updateUI();
}

// Start a new round.
function startGame() {
  // The round always starts at 0.00%
  discount = 0.00;
  crashed = false;
  gameActive = true;
  updateUI();
  document.getElementById("status").textContent =
    "Run in progress..." + (playerJoined ? " Hit Cash Out to double your bet!" : " (No Cash Out available)");
  
  // Enable Cash Out only if the player clicked Blast Off before the round started.
  document.getElementById("cashout").disabled = playerJoined ? false : true;
  
  // Reset rocket and explosion visuals.
  const rocketWrapper = document.getElementById("rocket-wrapper");
  rocketWrapper.style.display = "block";
  const explosionElem = document.getElementById("explosion");
  explosionElem.style.display = "none";
  explosionElem.classList.remove("explode");
  
  // Set up sounds.
  const bgMusic = document.getElementById("bg-music");
  const explosionSound = document.getElementById("explosion-sound");
  const rocketSound = document.getElementById("rocket-sound");
  bgMusic.volume = parseFloat(document.getElementById("bg-volume").value);
  explosionSound.volume = parseFloat(document.getElementById("sfx-volume").value);
  rocketSound.volume = parseFloat(document.getElementById("sfx-volume").value);
  
  bgMusic.play();
  rocketSound.play();
  
  gameInterval = setInterval(updateGame, 50);
  tickTimer = setInterval(updateDiscount, tickInterval);
}

// Handle a crash.
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  clearInterval(tickTimer);
  
  // If the player had clicked Blast Off, then reset both current and total discount.
  if (playerJoined) {
    discount = 0;
    totalDiscount = 0;
  }
  
  const rocketSound = document.getElementById("rocket-sound");
  rocketSound.pause();
  rocketSound.currentTime = 0;
  document.getElementById("explosion-sound").play();
  
  document.getElementById("rocket-wrapper").style.display = "none";
  const explosionElem = document.getElementById("explosion");
  explosionElem.style.left = document.getElementById("rocket-wrapper").style.left;
  explosionElem.style.bottom = document.getElementById("rocket-wrapper").style.bottom;
  explosionElem.style.display = "block";
  explosionElem.classList.add("explode");
  
  document.getElementById("status").textContent = "Run crashed! Discount lost!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = true;
  
  updateLeaderboard();
  
  // Restart round after a short delay.
  setTimeout(startGame, 2000);
}

// Handle cashing out.
function cashOut() {
  if (!gameActive || crashed || !playerJoined) return;
  gameActive = false;
  clearInterval(gameInterval);
  clearInterval(tickTimer);
  
  const cashoutSound = document.getElementById("cashout-sound");
  cashoutSound.volume = parseFloat(document.getElementById("cashout-volume").value);
  cashoutSound.play();
  
  const rocketSound = document.getElementById("rocket-sound");
  rocketSound.pause();
  rocketSound.currentTime = 0;
  
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "%!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = true;
  
  // Only if the player clicked Blast Off do we add the current discount to the total.
  totalDiscount += discount;
  updateAccumulatedDisplay();
  updateUI();
  updateLeaderboard();
  showShareOptions();
  
  // Restart round after a short delay.
  setTimeout(startGame, 2000);
}

// -------------------- Start Game Immediately --------------------
// (No countdown between rounds)
window.addEventListener("load", () => {
  updateLeaderboard();
  startGame();
});

// -------------------- Button Event Listeners --------------------

document.getElementById("ignite").addEventListener("click", () => {
  // When Blast Off is clicked, set flag so that Cash Out is enabled.
  playerJoined = true;
  document.getElementById("cashout").disabled = false;
});

document.getElementById("cashout").addEventListener("click", cashOut);

// -------------------- Volume Controls --------------------

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

function updateAccumulatedDisplay() {
  document.getElementById("discount-display").textContent = "Total Discount: " + totalDiscount.toFixed(2) + "%";
}
