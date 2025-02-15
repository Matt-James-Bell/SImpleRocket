// Global Variables
let discount = 0.00;  // Starts at 0%
let totalDiscount = 0.00;
let gameActive = false;
let crashed = false;
let playerJoined = false; // Set true if Blast Off is clicked during countdown
let countdownInterval;
let gameInterval;
let tickInterval = 50; // ms per tick
let tickTimer;

// -------------------- Dynamic Scale Function --------------------
// This function maps a percentage (0 to 20) to a fraction (0 to 1)
// such that the current discount is centered at 0.5 on the tick bars.
function dynamicScale(x) {
  if (discount <= 0) return x / 20;
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

function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  const centerX = (containerWidth - wrapperWidth) / 2;
  const centerY = (containerHeight - wrapperHeight) / 2;
  // Linear mapping: progress = discount / 20
  let t = discount / 20;
  rocketWrapper.style.left = (t * centerX) + "px";
  rocketWrapper.style.bottom = (t * centerY) + "px";
}

function updateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = "";
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  const ticks = [0, 5, 10, 15, 20];
  ticks.forEach(val => {
    let frac = dynamicScale(val);
    let pos = frac * containerWidth;
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
  let rocketCenter = rocketWrapper.offsetLeft + rocketWrapper.offsetWidth / 2;
  marker.style.left = rocketCenter + "px";
  bottomScale.appendChild(marker);
}

function updateVerticalTicker() {
  const verticalTicker = document.getElementById("vertical-ticker");
  verticalTicker.innerHTML = "";
  const containerHeight = document.getElementById("rocket-container").offsetHeight;
  const ticks = [0, 5, 10, 15, 20];
  ticks.forEach(val => {
    let frac = dynamicScale(val);
    let pos = (1 - frac) * containerHeight;
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
  let rocketCenter = rocketWrapper.offsetTop + rocketWrapper.offsetHeight / 2;
  marker.style.top = rocketCenter + "px";
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
  if (totalDiscount > highScore) {
    highScore = totalDiscount;
    localStorage.setItem("highScore", highScore.toFixed(2));
  }
  document.getElementById("leaderboard").innerHTML = "High Score: " + highScore.toFixed(2) + "%";
}

function showShareOptions() {
  document.getElementById("share-area").innerHTML =
    '<p>Share your score:</p>' +
    '<button onclick="alert(\'Shared on Twitter!\')">Twitter</button> ' +
    '<button onclick="alert(\'Shared on Facebook!\')">Facebook</button>';
}

function updateAccumulatedDisplay() {
  document.getElementById("discount-display").textContent = "Total Discount: " + totalDiscount.toFixed(2) + "%";
}

// -------------------- Game Mechanics --------------------

// Increase discount by 0.01% per tick and check explosion chance
function updateDiscount() {
  if (!gameActive) return;
  discount += 0.01;
  if (discount > 20) discount = 20;
  
  // Explosion probabilities per tick (approximate):
  // 0% - 5%: ~80% overall chance over ~500 ticks → 0.00402 per tick
  // 5% - 10%: ~10% overall chance over ~500 ticks → 0.0002 per tick
  // 10% - 20%: ~2% overall chance over ~1000 ticks → 0.00002 per tick
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

function updateGame() {
  if (!gameActive) return;
  updateUI();
}

function startGame() {
  // Start new round: reset discount to 0.00%
  discount = 0.00;
  crashed = false;
  gameActive = true;
  updateUI();
  document.getElementById("status").textContent =
    "Run in progress..." + (playerJoined ? " Hit Cash Out to double your bet!" : " (No Cash Out available)");
  
  // Enable Cash Out only if Blast Off was clicked during countdown
  document.getElementById("cashout").disabled = playerJoined ? false : true;
  
  // Ensure rocket and explosion elements are reset
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";
  document.getElementById("explosion").classList.remove("explode");
  
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
  
  // If Blast Off was clicked, reset both current and total discounts
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
  
  setTimeout(startCountdown, 2000);
}

function cashOut() {
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
  
  // Only if Blast Off was clicked, add current discount to total reward
  totalDiscount += discount;
  updateAccumulatedDiscount();
  updateUI();
  updateLeaderboard();
  showShareOptions();
  
  setTimeout(startCountdown, 2000);
}

// -------------------- Countdown --------------------

function startCountdown() {
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
      // At the end of the countdown, start the round.
      // Cash Out will be available only if Blast Off was clicked during countdown.
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

bgVolumeSlider.addEventListener("input", () => {
  document.getElementById("bg-music").volume = parseFloat(bgVolumeSlider.value);
});

sfxVolumeSlider.addEventListener("input", () => {
  document.getElementById("explosion-sound").volume = parseFloat(sfxVolumeSlider.value);
  document.getElementById("rocket-sound").volume = parseFloat(sfxVolumeSlider.value);
});

cashoutVolumeSlider.addEventListener("input", () => {
  document.getElementById("cashout-sound").volume = parseFloat(cashoutVolumeSlider.value);
});

function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Total Discount: " + totalDiscount.toFixed(2) + "%";
}
