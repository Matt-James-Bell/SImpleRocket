// Global variables
let discount = 0.00; // Game starts at 0%
const tickInterval = 50; // milliseconds per tick
let tickTimer = null;
let gameInterval; // For UI updates
let gameActive = false;
let crashed = false;
let accumulatedDiscount = 0;
let playerJoined = false; // True if player clicked Blast off during countdown
let countdownInterval;
let firstRun = true; // First run: 5 sec; subsequent: 5 sec

// Volume control elements
const bgVolumeSlider = document.getElementById("bg-volume");
const sfxVolumeSlider = document.getElementById("sfx-volume");
const cashoutVolumeSlider = document.getElementById("cashout-volume");

// -------------------- Dynamic Scale Function --------------------
// Maps a value between 0 and 20 to a fraction 0-1 so that the current discount is centered at 0.5.
function dynamicScale(x) {
  if (discount <= 0) return x / 20; // fallback if discount is 0
  if (x <= discount) {
    return 0.5 * (x / discount);
  } else {
    return 0.5 + 0.5 * ((x - discount) / (20 - discount));
  }
}

// -------------------- Utility Functions --------------------

function updateDiscountDisplay() {
  const shipElem = document.getElementById("ship-discount");
  const currentElem = document.getElementById("current-discount");
  const discountText = discount.toFixed(2) + "% Discount";
  const currentText = "Current: " + discount.toFixed(2) + "%";
  shipElem.textContent = discountText;
  currentElem.textContent = currentText;
  
  // Remove existing risk classes
  shipElem.classList.remove("low-risk", "mid-risk", "high-risk");
  currentElem.classList.remove("low-risk", "mid-risk", "high-risk");
  
  if (discount >= 0 && discount < 5) {
    shipElem.classList.add("low-risk");
    currentElem.classList.add("low-risk");
  } else if (discount >= 5 && discount < 10) {
    shipElem.classList.add("mid-risk");
    currentElem.classList.add("mid-risk");
  } else if (discount >= 10) {
    shipElem.classList.add("high-risk");
    currentElem.classList.add("high-risk");
  }
}

function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  let centerX = (containerWidth - wrapperWidth) / 2;
  let centerY = (containerHeight - wrapperHeight) / 2;
  // Linear mapping: progress = discount/20
  let t = discount / 20;
  rocketWrapper.style.left = (t * centerX) + "px";
  rocketWrapper.style.bottom = (t * centerY) + "px";
}

function updateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = "";
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  const ticks = [0, 5, 10, 15, 20];
  ticks.forEach(tickValue => {
    let frac = dynamicScale(tickValue);
    let leftPos = frac * containerWidth;
    const tick = document.createElement("div");
    tick.className = "tick";
    tick.style.left = leftPos + "px";
    bottomScale.appendChild(tick);
    const label = document.createElement("div");
    label.className = "tick-label";
    label.textContent = tickValue.toFixed(0) + "%";
    label.style.left = (leftPos - 10) + "px";
    bottomScale.appendChild(label);
  });
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const rocketCenterX = rocketWrapper.offsetLeft + rocketWrapper.offsetWidth / 2;
  const marker = document.createElement("div");
  marker.className = "tick-marker";
  marker.style.left = rocketCenterX + "px";
  bottomScale.appendChild(marker);
}

function updateVerticalTicker() {
  const verticalTicker = document.getElementById("vertical-ticker");
  verticalTicker.innerHTML = "";
  const container = document.getElementById("rocket-container");
  const containerHeight = container.offsetHeight;
  const ticks = [0, 5, 10, 15, 20];
  ticks.forEach(tickValue => {
    let frac = dynamicScale(tickValue);
    let topPos = (1 - frac) * containerHeight;
    const tick = document.createElement("div");
    tick.className = "v-tick";
    tick.style.top = topPos + "px";
    verticalTicker.appendChild(tick);
    const label = document.createElement("div");
    label.className = "v-tick-label";
    label.textContent = tickValue.toFixed(0) + "%";
    label.style.top = (topPos - 5) + "px";
    verticalTicker.appendChild(label);
  });
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const rocketCenterY = rocketWrapper.offsetTop + rocketWrapper.offsetHeight / 2;
  const marker = document.createElement("div");
  marker.className = "v-tick-marker";
  marker.style.top = rocketCenterY + "px";
  verticalTicker.appendChild(marker);
}

function updateUI() {
  updateDiscountDisplay();
  updateRocketPosition();
  updateBottomScale();
  updateVerticalTicker();
}

function updateLeaderboard() {
  let highScore = parseFloat(localStorage.getItem("highScore")) || 0;
  if (accumulatedDiscount > highScore) {
    highScore = accumulatedDiscount;
    localStorage.setItem("highScore", highScore.toString());
  }
  document.getElementById("leaderboard").innerHTML = "High Score: " + highScore.toFixed(2) + "%";
}

function showShareOptions() {
  document.getElementById("share-area").innerHTML =
    '<p>Share your score:</p>' +
    '<button onclick="alert(\'Shared on Twitter!\')">Twitter</button> ' +
    '<button onclick="alert(\'Shared on Facebook!\')">Facebook</button>';
}

// -------------------- Game Mechanics --------------------

// Increase discount by 0.01% per tick and check explosion chance
function updateDiscount() {
  if (!gameActive) return;
  discount += 0.01;
  if (discount > 20) discount = 20;
  
  // Determine per-tick explosion probability:
  // 0%-5%: overall chance ~80% over ~500 ticks → per-tick probability ≈ 0.00402
  // 5%-10%: overall chance ~8% over ~500 ticks → per-tick probability ≈ 0.0001667
  // 10%-20%: overall chance ~2% over ~1000 ticks → per-tick probability ≈ 0.0000202
  let explosionProb = 0;
  if (discount >= 0 && discount < 5) {
    explosionProb = 0.00402;
  } else if (discount >= 5 && discount < 10) {
    explosionProb = 0.0001667;
  } else if (discount >= 10 && discount <= 20) {
    explosionProb = 0.0000202;
  }
  
  if (Math.random() < explosionProb) {
    crash();
    return;
  }
  
  updateUI();
}

function updateGame() {
  if (!gameActive) return;
  updateUI();
}

function startGame() {
  // Start at 0.00%
  discount = 0.00;
  crashed = false;
  gameActive = true;
  updateUI();
  document.getElementById("status").textContent =
    "Run in progress..." + (playerJoined ? " Hit Cash Out to double your bet!" : " (No Cash Out available)");
  
  // Enable Cash Out only if the player clicked Blast off during the countdown
  if (playerJoined) {
    document.getElementById("cashout").disabled = false;
  } else {
    document.getElementById("cashout").disabled = true;
  }
  
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";
  
  const bgMusic = document.getElementById("bg-music");
  const explosionSound = document.getElementById("explosion-sound");
  const rocketSound = document.getElementById("rocket-sound");
  bgMusic.volume = parseFloat(bgVolumeSlider.value);
  explosionSound.volume = parseFloat(sfxVolumeSlider.value);
  rocketSound.volume = parseFloat(sfxVolumeSlider.value);
  
  bgMusic.play();
  rocketSound.play();
  
  gameInterval = setInterval(updateGame, 50);
  tickTimer = setInterval(updateDiscount, tickInterval);
}

function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  clearInterval(tickTimer);
  
  // Only if the player had clicked Blast off, lose current and total discount
  if (playerJoined) {
    discount = 0;
    accumulatedDiscount = 0;
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
  
  setTimeout(startCountdown, 2000);
}

function cashOut() {
  // Cash out works only if player hit Blast off during the countdown
  if (!gameActive || crashed || !playerJoined) return;
  gameActive = false;
  clearInterval(gameInterval);
  clearInterval(tickTimer);
  
  const cashoutSound = document.getElementById("cashout-sound");
  cashoutSound.volume = parseFloat(cashoutVolumeSlider.value);
  cashoutSound.play();
  
  const rocketSound = document.getElementById("rocket-sound");
  rocketSound.pause();
  rocketSound.currentTime = 0;
  
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "%!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = true;
  
  // Only if the player hit Blast off do we double the bet
  if (playerJoined) {
    accumulatedDiscount += discount;
  }
  updateAccumulatedDiscount();
  updateUI();
  updateLeaderboard();
  showShareOptions();
  
  setTimeout(startCountdown, 2000);
}

// -------------------- Countdown --------------------

function startCountdown() {
  // Always start with a 5-second countdown
  document.getElementById("bg-music").play();
  
  playerJoined = false;
  const countdownDiv = document.getElementById("countdown");
  let duration = 5;
  countdownDiv.style.display = "block";
  countdownDiv.textContent = duration;
  document.getElementById("ignite").disabled = false;
  
  countdownInterval = setInterval(() => {
    duration--;
    if (duration > 0) {
      countdownDiv.textContent = duration;
    } else {
      clearInterval(countdownInterval);
      countdownDiv.style.display = "none";
      // At the end of the countdown, start the run.
      // (Cash Out will only be available if the player clicked Blast off during the countdown.)
      startRun();
    }
  }, 1000);
  firstRun = false;
}

function startRun() {
  document.getElementById("ignite").disabled = true;
  startGame();
}

// -------------------- Event Listeners --------------------

window.addEventListener("load", () => {
  updateLeaderboard();
  startCountdown();
});

document.getElementById("ignite").addEventListener("click", () => {
  clearInterval(countdownInterval);
  document.getElementById("countdown").style.display = "none";
  playerJoined = true;
  document.getElementById("cashout").disabled = false;
  startRun();
});

document.getElementById("cashout").addEventListener("click", cashOut);

// Continuous volume control for all sounds
bgVolumeSlider.addEventListener("input", () => {
  const bgMusic = document.getElementById("bg-music");
  bgMusic.volume = parseFloat(bgVolumeSlider.value);
});

sfxVolumeSlider.addEventListener("input", () => {
  const explosionSound = document.getElementById("explosion-sound");
  const rocketSound = document.getElementById("rocket-sound");
  explosionSound.volume = parseFloat(sfxVolumeSlider.value);
  rocketSound.volume = parseFloat(sfxVolumeSlider.value);
});

cashoutVolumeSlider.addEventListener("input", () => {
  const cashoutSound = document.getElementById("cashout-sound");
  cashoutSound.volume = parseFloat(cashoutVolumeSlider.value);
});

// Reusable update for accumulated discount display
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Total Discount: " + accumulatedDiscount.toFixed(2) + "%";
}
