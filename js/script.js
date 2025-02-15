document.addEventListener("DOMContentLoaded", function() {
  // DOM element references
  const igniteButton = document.getElementById('ignite');
  const cashoutButton = document.getElementById('cashout');
  const shipDiscountEl = document.getElementById('ship-discount');
  const statusEl = document.getElementById('status');
  const discountDisplayEl = document.getElementById('discount-display');
  const currentDiscountEl = document.getElementById('current-discount');
  const explosionEl = document.getElementById('explosion');
  const countdownEl = document.getElementById('countdown');
  const statsInfoEl = document.getElementById('stats-info');

  // Audio elements
  const bgMusic = document.getElementById('bg-music');
  const explosionSound = document.getElementById('explosion-sound');
  const rocketSound = document.getElementById('rocket-sound');
  const cashoutSound = document.getElementById('cashout-sound');

  // Game variables
  let discountTimer = null;
  let currentDiscount = 1; // start at 1%
  const maxDiscount = 20;
  const discountInterval = 2000; // double every 2 seconds
  let gameActive = false;

  // Data tracking stats; load from localStorage if available
  let stats = {
    runs: 0,
    cashouts: 0,
    crashes: 0,
    totalDiscount: 0 // total discount percentage from successful cashouts
  };

  function loadStats() {
    const saved = localStorage.getItem("discountGameStats");
    if (saved) {
      stats = JSON.parse(saved);
    }
  }

  function saveStats() {
    localStorage.setItem("discountGameStats", JSON.stringify(stats));
  }

  function updateStatsDisplay() {
    // Calculate average discount from cashouts (avoid division by zero)
    let avgDiscount = stats.cashouts ? (stats.totalDiscount / stats.cashouts).toFixed(2) : 0;
    statsInfoEl.textContent = `Runs: ${stats.runs} | Cashouts: ${stats.cashouts} | Crashes: ${stats.crashes} | Avg Discount: ${avgDiscount}%`;
  }

  // Initialize stats from storage
  loadStats();
  updateStatsDisplay();

  // Update the discount display on the rocket and info panel
  function updateDisplay() {
    shipDiscountEl.textContent = currentDiscount.toFixed(2) + '% Discount';
    currentDiscountEl.textContent = 'Current: ' + currentDiscount.toFixed(2) + '%';

    // Color coding based on risk/discount level
    if (currentDiscount < 5) {
      shipDiscountEl.style.color = '#90ee90'; // light green
    } else if (currentDiscount < 10) {
      shipDiscountEl.style.color = 'yellow';
    } else {
      shipDiscountEl.style.color = 'red';
    }
  }

  // Function to update the discount (doubling until cap)
  function updateDiscount() {
    if (currentDiscount < maxDiscount) {
      currentDiscount *= 2;
      if (currentDiscount > maxDiscount) {
        currentDiscount = maxDiscount;
      }
      updateDisplay();
    } else {
      // Reached max discount—stop increasing further
      clearInterval(discountTimer);
    }
  }

  // Start the game: reset discount, update UI, and start the discount timer
  function startGame() {
    currentDiscount = 1;
    updateDisplay();
    statusEl.textContent = 'Game in progress...';
    countdownEl.style.display = 'none'; // hide countdown during gameplay

    // Play sounds
    bgMusic.play();
    rocketSound.play();

    // Enable cashout and disable ignite to prevent mid-run restart
    cashoutButton.disabled = false;
    igniteButton.disabled = true;
    gameActive = true;

    // Track run count
    stats.runs++;
    saveStats();
    updateStatsDisplay();

    // Start the progressive discount timer
    discountTimer = setInterval(updateDiscount, discountInterval);
  }

  // Cash out function: locks in the current discount and stops progression
  function cashOut() {
    if (!gameActive) return;
    clearInterval(discountTimer);
    gameActive = false;

    // Stop the rocket sound and play the cashout sound
    rocketSound.pause();
    cashoutSound.play();

    statusEl.textContent = 'You cashed out with a ' + currentDiscount.toFixed(2) + '% discount!';
    discountDisplayEl.textContent = 'Total Discount: ' + currentDiscount.toFixed(2) + '%';

    // Track cashout and add discount to total
    stats.cashouts++;
    stats.totalDiscount += currentDiscount;
    saveStats();
    updateStatsDisplay();

    // Optionally, start a timer for discount expiration here (e.g., 15 minutes)

    // Reset buttons for the next run
    igniteButton.disabled = false;
    cashoutButton.disabled = true;
  }

  // Simulate a rocket crash (loss condition)
  function rocketCrash() {
    if (!gameActive) return;
    clearInterval(discountTimer);
    gameActive = false;

    // Stop sounds and play explosion effect
    rocketSound.pause();
    bgMusic.pause();
    explosionSound.play();

    // Show explosion animation
    explosionEl.style.display = 'block';
    statusEl.textContent = 'Oh no! The rocket exploded. You lost your discount.';
    currentDiscount = 0;
    updateDisplay();

    // Track crash
    stats.crashes++;
    saveStats();
    updateStatsDisplay();

    // Reset after a short delay
    setTimeout(function() {
      explosionEl.style.display = 'none';
      igniteButton.disabled = false;
      cashoutButton.disabled = true;
      statusEl.textContent = 'Waiting for run...';
      countdownEl.style.display = 'block';
    }, 3000);
  }

  // Event listeners for buttons
  igniteButton.addEventListener('click', function() {
    startGame();
    // For demo purposes, simulate a random crash between 10 and 20 seconds.
    const crashTime = Math.floor(Math.random() * 10000) + 10000;
    setTimeout(rocketCrash, crashTime);
  });

  cashoutButton.addEventListener('click', function() {
    cashOut();
  });
});
