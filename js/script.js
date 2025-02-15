// Global variables
let discount = 0.00; // This will be set to 1% at game start
const doublingInterval = 3000; // Interval (ms) for discount doubling
let doublingTimer = null;
let gameInterval; // For UI updates
let gameActive = false;
let crashed = false;
let startTime;
let accumulatedDiscount = 0;
let playerJoined = false;
let countdownInterval;
let firstRun = true; // First run: 5 sec; subsequent: 5 sec

// Daily limit settings
const dailyLimit = 5;

// Volume control elements
const bgVolumeSlider = document.getElementById("bg-volume");
const sfxVolumeSlider = document.getElementById("sfx-volume");
const cashoutVolumeSlider = document.getElementById("cashout-volume");

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
  
  if (discount <= 5) {
    shipElem.classList.add("low-risk");
    currentElem.classList.add("low-risk");
  } else if (discount <= 10) {
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
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  let centerX = (containerWidth - wrapperWidth) / 2;
  let centerY = (containerHeight - wrapperHeight) / 2;
  // Use discount/20 as a factor (0 to 1)
  let t = discount / 20;
  rocketWrapper.style.left = (t * centerX) + "px";
  rocketWrapper.style.bottom = (t * centerY) + "px";
}

function updateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = "";
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  // Fixed ticks: 0%, 5%, 10%, 15%, 20%
  const ticks = [0, 5, 10, 15, 20];
  ticks.forEach(tickValue => {
    let normalizedTick = tickValue / 20;
    let leftPos = normalizedTick * containerWidth;
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
    let normalizedTick = tickValue / 20;
    let topPos = (1 - normalizedTick) * containerHeight;
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
  // For simplicity, we add dummy share buttons/links.
  document.getElementById("share-area").innerHTML =
    '<p>Share your score:</p>' +
    '<button onclick="alert(\'Shared on Twitter!\')">Twitter</button> ' +
    '<button onclick="alert(\'Shared on Facebook!\')">Facebook</button>';
}

function checkDailyLimit() {
  const today = new Date().toISOString().slice(0, 10);
  let lastPlayDate = localStorage.getItem("lastPlayDate");
  let playsToday = parseInt(localStorage.getItem("playsToday")) || 0;
  if (lastPlayDate !== today) {
    localStorage.setItem("lastPlayDate", today);
    localStorage.setItem("playsToday", "0");
    playsToday = 0;
  }
  return playsToday;
}

function incrementDailyPlays() {
  let playsToday = checkDailyLimit();
  playsToday++;
  localStorage.setItem("playsToday", playsToday.toString());
}

// -------------------- Game Mechanics --------------------

function startDoublingTimer() {
  doublingTimer = setInterval(() => {
    if (!gameActive) return;
    // Calculate crash probability (risk increases with discount)
    // Using a simple formula: probability = (discount - 1)/50
    let crashProb = (discount - 1) / 50;
    if (Math.random() < crashProb) {
      crash();
      return;
    }
    // Double the discount (capped at 20%)
    let newDiscount = discount * 2;
    if (newDiscount > 20) {
      newDiscount = 20;
    }
    discount = newDiscount;
    updateUI();
  }, doublingInterval);
}

function updateGame() {
  if (!gameActive) return;
  updateUI();
}

function startGame() {
  // Reset discount to initial 1%
  discount = 1;
  crashed = false;
  gameActive = true;
  updateUI();
  document.getElementById("status").textContent = "Run in progress... Hit Cash Out to lock in your discount!";
  
  // Enable cash out only if player joined
  if (playerJoined) {
    document.getElementById("cashout").disabled = false;
  } else {
    document.getElementById("cashout").disabled = true;
  }
  
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";
  
  // Set volumes from sliders
  const bgMusic = document.getElementById("bg-music");
  const explosionSound = document.getElementById("explosion-sound");
  const rocketSound = document.getElementById("rocket-sound");
  bgMusic.volume = parseFloat(bgVolumeSlider.value);
  explosionSound.volume = parseFloat(sfxVolumeSlider.value);
  rocketSound.volume = parseFloat(sfxVolumeSlider.value);
  
  bgMusic.play();
  rocketSound.play();
  
  // Start UI update interval
  gameInterval = setInterval(updateGame, 50);
  
  // Start the doubling (discount update) timer
  startDoublingTimer();
}

function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  clearInterval(doublingTimer);
  
  // Lose all accumulated discount on crash
  accumulatedDiscount = 0;
  
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
  
  document.getElementById("status").textContent = "Run crashed! Total discount lost!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = true;
  
  // Update leaderboard (if necessary)
  updateLeaderboard();
  
  setTimeout(startCountdown, 2000);
}

function cashOut() {
  if (!gameActive || crashed || !playerJoined) return;
  gameActive = false;
  clearInterval(gameInterval);
  clearInterval(doublingTimer);
  
  const cashoutSound = document.getElementById("cashout-sound");
  cashoutSound.volume = parseFloat(cashoutVolumeSlider.value);
  cashoutSound.play();
  
  const rocketSound = document.getElementById("rocket-sound");
  rocketSound.pause();
  rocketSound.currentTime = 0;
  
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = true;
  
  accumulatedDiscount += discount;
  updateAccumulatedDiscount();
  updateLeaderboard();
  
  // Show social sharing options
  showShareOptions();
  
  setTimeout(startCountdown, 2000);
}

// -------------------- Countdown & Daily Limit --------------------

function startCountdown() {
  // Check daily play limit
  let playsToday = checkDailyLimit();
  if (playsToday >= dailyLimit) {
    document.getElementById("status").textContent = "Daily play limit reached. Come back tomorrow!";
    document.getElementById("ignite").disabled = true;
    document.getElementById("cashout").disabled = true;
    return;
  }
  
  // Start playing background music immediately
  document.getElementById("bg-music").play();
  
  playerJoined = false;
  const countdownDiv = document.getElementById("countdown");
  let duration = 5; // Countdown duration: 5 seconds
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
      // If the player did not hit "Blast off" during countdown, start run automatically (with no discount secured)
      if (!playerJoined) {
        document.getElementById("cashout").disabled = true;
        startRun();
      }
    }
  }, 1000);
  firstRun = false;
  
  // Increment daily plays since a run is about to start
  incrementDailyPlays();
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
  // Unlock cash out since the player pressed Blast off
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

function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Total Discount: " + accumulatedDiscount.toFixed(2) + "%";
}
