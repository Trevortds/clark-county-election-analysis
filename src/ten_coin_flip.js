/**
 * Ten coin flip visualization logic
 * This handles the animation and state for ten coin flips
 */

// Coins state management
const coinsState = {
  isAnimating: false,
  results: [], // Array of 'heads' or 'tails'
  totalCoins: 10,
  headsProbability: 0.5 // Default 50/50 chance
};

/**
 * Animate a single coin flip
 * @param {HTMLElement} coinElement - The coin element to animate
 * @returns {Promise<string>} - Promise that resolves to 'heads' or 'tails'
 */
function animateSingleCoin(coinElement) {
  return new Promise((resolve) => {
    // Clear any previous animations
    coinElement.style.animation = 'none';
    coinElement.offsetHeight; // Trigger reflow
    
    // Random number of flips with slightly different durations for each coin
    const flipDuration = 2000 + Math.random() * 500;
    
    // Determine if heads or tails based on configured probability
    const result = Math.random() < coinsState.headsProbability ? 'heads' : 'tails';
    
    // Set animation properties
    const animationName = result === 'heads' ? 'flip-to-heads' : 'flip-to-tails';
    coinElement.style.animation = `${animationName} ${flipDuration}ms ease-out forwards`;
    
    // Handle animation end
    setTimeout(() => {
      resolve(result);
    }, flipDuration);
  });
}

/**
 * Animate all coins and return the results
 * @param {NodeList|Array} coinElements - The coin elements to animate
 * @returns {Promise<string[]>} - Promise that resolves to array of 'heads' or 'tails'
 */
function animateCoins(coinElements) {
  return new Promise((resolve) => {
    if (coinsState.isAnimating) return;
    
    coinsState.isAnimating = true;
    coinsState.results = [];
    
    // Animate each coin with a promise
    const flipPromises = Array.from(coinElements).map(coin => animateSingleCoin(coin));
    
    // When all flips are complete
    Promise.all(flipPromises).then(results => {
      coinsState.results = results;
      coinsState.isAnimating = false;
      resolve(results);
    });
  });
}

/**
 * Calculate statistics from coin flip results
 * @param {string[]} results - Array of 'heads' or 'tails'
 * @returns {Object} - Statistics about the results
 */
function calculateStats(results) {
  const headsCount = results.filter(r => r === 'heads').length;
  const totalCoins = results.length;
  
  return {
    headsCount,
    tailsCount: totalCoins - headsCount,
    headsPercentage: (headsCount / totalCoins) * 100
  };
}

/**
 * Format the statistics for display
 * @param {Object} stats - Statistics object
 * @param {number} userGuess - User's guess for percentage of heads
 * @returns {string} - Formatted statistics with win/lose message
 */
function formatStats(stats, userGuess) {
  let resultText = `
    <p>Results: ${stats.headsCount} Heads (${stats.headsPercentage.toFixed(0)}%), ${stats.tailsCount} Tails (${(100 - stats.headsPercentage).toFixed(0)}%)</p>
  `;
  
  if (userGuess !== null) {
    // Calculate if user was within 10% range
    const guessPercentage = userGuess;
    const actualPercentage = stats.headsPercentage;
    
    const isCorrect = Math.abs(guessPercentage - actualPercentage) <= 10;
    
    resultText += `
      <p class="prediction-result">${isCorrect ? 
        'Nice! Your guess was within 10% of the actual result!' : 
        'Too bad, your guess was off by more than 10%. Try again!'}</p>
    `;
  }
  
  return resultText;
}

/**
 * Initialize the ten-coin flip game
 * @param {string} coinsContainerId - ID of the container with the coins
 * @param {string} buttonElementId - ID of the flip button
 * @param {string} resultElementId - ID of the result display element
 * @param {string} sliderElementId - ID of the probability slider element
 */
function initTenCoinFlip(coinsContainerId, buttonElementId, resultElementId, sliderElementId, guessInputId) {
  const coinElements = document.querySelectorAll(`#${coinsContainerId} .coin`);
  const flipButton = document.getElementById(buttonElementId);
  const resultElement = document.getElementById(resultElementId);
  const sliderElement = document.getElementById(sliderElementId);
  const guessInput = document.getElementById(guessInputId);
  
  // Ensure elements exist
  if (!coinElements.length || !flipButton || !resultElement || !sliderElement || !guessInput) {
    console.error('Required elements not found');
    return;
  }
  
  // Set up slider change handler
  sliderElement.addEventListener('input', () => {
    const probability = parseFloat(sliderElement.value);
    coinsState.headsProbability = probability;
    
    // Update the display next to the slider
    const probabilityDisplay = document.getElementById('ten-probability-display');
    if (probabilityDisplay) {
      probabilityDisplay.textContent = `${(probability * 100).toFixed(0)}%`;
    }
  });
  
  // Set up button click handler
  flipButton.addEventListener('click', async () => {
    if (coinsState.isAnimating) return;
    
    // Get user's guess
    const userGuess = parseInt(guessInput.value);
    if (isNaN(userGuess) || userGuess < 0 || userGuess > 100) {
      resultElement.innerHTML = '<p class="error">Please enter a valid percentage between 0 and 100!</p>';
      return;
    }
    
    // Disable button during animation
    flipButton.disabled = true;
    resultElement.innerHTML = '<p>Flipping...</p>';
    
    // Run animation and get results
    const results = await animateCoins(coinElements);
    
    // Calculate and display statistics
    const stats = calculateStats(results);
    resultElement.innerHTML = formatStats(stats, userGuess);
    
    // Re-enable button
    flipButton.disabled = false;
  });
}

// Export functions
export { initTenCoinFlip, animateCoins, calculateStats };
