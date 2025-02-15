let discount = 1.00;
let totalDiscount = 0.00;
let gameActive = false;
let crashed = false;
let playerJoined = false;
let countdownInterval;
let gameInterval;

function startCountdown() {
    let count = 5;
    document.getElementById("countdown").textContent = count;
    countdownInterval = setInterval(() => {
        count--;
        document.getElementById("countdown").textContent = count;
        if (count === 0) {
            clearInterval(countdownInterval);
            startRun();
        }
    }, 1000);
}

function startRun() {
    document.getElementById("ignite").disabled = true;
    gameActive = true;
    crashed = false;
    discount = 1.00;
    updateDisplay();

    gameInterval = setInterval(() => {
        if (!gameActive) return;
        discount += 0.01;
        if (discount >= 20.00) discount = 20.00;

        let explodeChance = Math.random();
        if (
            (discount < 5 && explodeChance < 0.8) ||
            (discount < 10 && explodeChance < 0.08) ||
            (discount < 20 && explodeChance < 0.02)
        ) {
            crash();
        }

        updateDisplay();
    }, 50);
}

function crash() {
    gameActive = false;
    crashed = true;
    clearInterval(gameInterval);

    if (playerJoined) {
        totalDiscount = 0.00;
    }

    document.getElementById("status").textContent = "Crashed! Discount lost.";
    startCountdown();
}

function cashOut() {
    if (!gameActive || crashed || !playerJoined) return;
    gameActive = false;
    totalDiscount += discount;
    document.getElementById("status").textContent = "Cashed Out!";
    updateDisplay();
    startCountdown();
}

function updateDisplay() {
    document.getElementById("ship-discount").textContent = discount.toFixed(2) + "%";
    document.getElementById("discount-display").textContent = "Total Discount: " + totalDiscount.toFixed(2) + "%";
}

document.getElementById("ignite").addEventListener("click", () => {
    playerJoined = true;
});

document.getElementById("cashout").addEventListener("click", cashOut);

startCountdown();
