/**
 * Coin flip visualization logic
 * This handles the animation and state for the coin flip game
 */

// Coin state management
const coinState = {
  isAnimating: false,
  result: null, // null, 'heads', or 'tails'
  headsProbability: 0.5 // Default 50/50 chance
};

/**
 * Animate the coin flip and return the result
 * @param {HTMLElement} coinElement - The coin element to animate
 * @returns {Promise<string>} - Promise that resolves to 'heads' or 'tails'
 */
function animateCoinFlip(coinElement) {
  return new Promise((resolve) => {
    if (coinState.isAnimating) return;
    
    coinState.isAnimating = true;
    coinState.result = null;
    
    // Get the coin container for 3D perspective
    const coinContainer = coinElement.parentElement;
    
    // Clear any previous animations/transforms
    coinElement.style.animation = 'none';
    coinElement.offsetHeight; // Trigger reflow
    
    // Random number of flips (between 5-10 complete rotations)
    const numFlips = 5 + Math.floor(Math.random() * 6);
    const flipDuration = 2000; // ms
    
    // Determine if heads or tails based on configured probability
    const result = Math.random() < coinState.headsProbability ? 'heads' : 'tails';
    
    // Set animation properties
    const animationName = result === 'heads' ? 'flip-to-heads' : 'flip-to-tails';
    coinElement.style.animation = `${animationName} ${flipDuration}ms ease-out forwards`;
    
    // Handle animation end
    setTimeout(() => {
      coinState.isAnimating = false;
      coinState.result = result;
      resolve(result);
    }, flipDuration);
  });
}

/**
 * Initialize the coin flip game
 * @param {string} coinElementId - ID of the coin element
 * @param {string} buttonElementId - ID of the flip button
 * @param {string} resultElementId - ID of the result display element
 * @param {string} sliderElementId - ID of the probability slider element
 */
function initCoinFlip(coinElementId, buttonElementId, resultElementId, sliderElementId) {
  const coinElement = document.getElementById(coinElementId);
  const flipButton = document.getElementById(buttonElementId);
  const resultElement = document.getElementById(resultElementId);
  const sliderElement = document.getElementById(sliderElementId);
  
  // Ensure elements exist
  if (!coinElement || !flipButton || !resultElement || !sliderElement) {
    console.error('Required elements not found');
    return;
  }
  
  // Set up slider change handler
  sliderElement.addEventListener('input', () => {
    const probability = parseFloat(sliderElement.value);
    coinState.headsProbability = probability;
    
    // Update the display next to the slider
    const probabilityDisplay = document.getElementById('probability-display');
    if (probabilityDisplay) {
      probabilityDisplay.textContent = `${(probability * 100).toFixed(0)}%`;
    }
  });
  
  // Set up button click handler
  flipButton.addEventListener('click', async () => {
    if (coinState.isAnimating) return;
    
    // Disable button during animation
    flipButton.disabled = true;
    resultElement.textContent = 'Flipping...';
    
    // Run animation and get result
    const result = await animateCoinFlip(coinElement);
    
    // Update UI
    resultElement.textContent = `Result: ${result.charAt(0).toUpperCase() + result.slice(1)}`;
    
    // Re-enable button
    flipButton.disabled = false;
  });
}

// Export functions
export { initCoinFlip, animateCoinFlip };
