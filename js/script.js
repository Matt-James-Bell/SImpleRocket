// Global variables
let gameActive = false;
let discount = 1.00;      // Starts at 1.00%
let totalDiscount = 0.00; // Total discount won
let crashTime;            // Random crash time in ms
let startTime;
let tickTimer;
let cashedOut = false;
let playerBet = false;    // True if player clicked Blast Off before round starts

// Get DOM elements
const statusDisplay = document.getElementById("status");
const currentDisplay = document.getElementById("current");
const totalDisplay = document.getElementById("total");
const blastBtn = document.getElementById("blastOff");
const cashBtn = document.getElementById("cashOut");
const rocketWrapper = document.getElementById("rocket-wrapper");

// Start a new round
function startRound() {
  // Reset values for new round
  discount = 1.00;
  cashedOut = false;
  gameActive = true;
  // Player must click Blast Off BEFORE round starts to bet
  // (playerBet remains false if they did not)
  
  // Generate a random crash time (e.g., between 3000 and 6000 ms)
  crashTime = Math.random() * 3000 + 3000;
  startTime = Date.now();
  statusDisplay.textContent = "Run in progress! " + (playerBet ? "Cash Out to lock your discount!" : "No bet placed.");
  
  // If player bet, enable Cash Out; otherwise, disable it.
  cashBtn.disabled = playerBet ? false : true;
  
  // Reset rocket position: starts at the far left of container.
  rocketWrapper.style.left = "0px";
  
  // Start the game loop.
  tickTimer = setInterval(gameLoop, 50);
}

// The game loop: update discount, move rocket, check for crash.
function gameLoop() {
  if (!gameActive) return;
  let elapsed = Date.now() - startTime;
  
  // Increase discount over time (for example, 1% per second)
  discount = 1.00 + elapsed * 0.001;
  currentDisplay.textContent = "Current Discount: " + discount.toFixed(2) + "%";
  
  // Move the rocket horizontally:
  // At 1.00%, rocket is at left edge; at 20.00%, rocket is centered.
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  const rocketWidth = rocketWrapper.offsetWidth;
  // Calculate max left: when rocket is centered, left should equal (containerWidth - rocketWidth) / 2
  const maxLeft = (containerWidth - rocketWidth) / 2;
  // Map discount from 1 to 20 linearly to left from 0 to maxLeft.
  let t = (discount - 1) / (20 - 1); // normalized value from 0 to 1
  let currentLeft = t * maxLeft;
  rocketWrapper.style.left = currentLeft + "px";
  
  // Check for crash
  if (elapsed >= crashTime) {
    crash();
  }
}

// When the rocket crashes
function crash() {
  clearInterval(tickTimer);
  gameActive = false;
  // If player bet and did not cash out, they lose all total discount.
  if (playerBet && !cashedOut) {
    totalDiscount = 0.00;
  }
  statusDisplay.textContent = "Crashed! You lost your discount.";
  totalDisplay.textContent = "Total Discount Won: " + totalDiscount.toFixed(2) + "%";
  // Reset for next round
  resetRound();
}

// When the player cashes out
function cashOut() {
  if (!gameActive || cashedOut) return;
  cashedOut = true;
  clearInterval(tickTimer);
  gameActive = false;
  totalDiscount += discount;
  statusDisplay.textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  totalDisplay.textContent = "Total Discount Won: " + totalDiscount.toFixed(2) + "%";
  resetRound();
}

// Reset round variables and buttons for the next round after a short delay.
function resetRound() {
  setTimeout(() => {
    // Reset the bet flag for next round.
    playerBet = false;
    blastBtn.disabled = false;
    cashBtn.disabled = true;
    statusDisplay.textContent = "Press Blast Off to start the next round.";
  }, 2000);
}

// Button event listeners
blastBtn.addEventListener("click", () => {
  // Player clicked Blast Off BEFORE the round starts.
  playerBet = true;
  blastBtn.disabled = true;
  // Immediately start the round.
  startRound();
});

cashBtn.addEventListener("click", () => {
  cashOut();
});

// (Optional) Start the first round automatically if desired:
// startRound();
