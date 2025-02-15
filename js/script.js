let discount = 1.00;
const maxDiscount = 20.00;
let gameActive = false;
let crashed = false;
let accumulatedDiscount = 0;
let playerJoined = false;

function startGame() {
  discount = 1.00;
  crashed = false;
  gameActive = true;
  document.getElementById("status").textContent = "Run in progress...";

  if (playerJoined) {
    document.getElementById("cashout").disabled = false;
  } else {
    document.getElementById("cashout").disabled = true;
  }

  let crashPoint = getRandomCrashPoint();
  let gameInterval = setInterval(() => {
    if (!gameActive) return;
    discount += 0.01;
    document.getElementById("current-discount").textContent = "Current: " + discount.toFixed(2) + "%";

    if (discount >= crashPoint) {
      crash(gameInterval);
    }
  }, 50);
}

function getRandomCrashPoint() {
  let r = Math.random();
  if (r < 0.8) return Math.random() * (5.00 - 1.00) + 1.00;
  if (r < 0.9) return Math.random() * (0.02 - 0.01) + 0.01;
  if (r < 0.98) return Math.random() * (10.00 - 5.00) + 5.00;
  return Math.random() * (20.00 - 10.00) + 10.00;
}

function crash(interval) {
  gameActive = false;
  crashed = true;
  clearInterval(interval);
  document.getElementById("status").textContent = "Rocket Exploded!";
  if (playerJoined) accumulatedDiscount = 0;
}

function cashOut() {
  if (!gameActive || crashed || !playerJoined) return;
  gameActive = false;
  accumulatedDiscount += discount;
  document.getElementById("discount-display").textContent = "Total Discount: " + accumulatedDiscount.toFixed(2) + "%";
  document.getElementById("status").textContent = "Cashed out!";
}

document.getElementById("ignite").addEventListener("click", () => { playerJoined = true; startGame(); });
document.getElementById("cashout").addEventListener("click", cashOut);
